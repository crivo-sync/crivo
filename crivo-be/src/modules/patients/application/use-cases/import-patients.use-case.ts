import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { decodeCsvBuffer, parseCsv } from 'src/shared/csv/parse-csv';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../../domain/repository/patient.repository';
import {
  PatientCsvService,
  type ExtractedPatient,
} from '../services/patient-csv.service';

/**
 * Teto de linhas. Uma clínica de porte médio tem alguns milhares de
 * pacientes; acima disso é quase certo que o arquivo não é uma lista de
 * pacientes, e processar em memória deixaria de ser adequado.
 */
export const MAX_IMPORT_ROWS = 5_000;

export type ImportPatientsInput = {
  tenantId: string;
  fileBuffer: Buffer;
  /**
   * Quando `true`, analisa e devolve o relatório **sem gravar nada**. É o que
   * a tela usa para mostrar a prévia: importação é a operação em que o erro
   * de mapeamento de coluna só aparece depois de sujar a base inteira.
   */
  dryRun: boolean;
};

export type ImportRowIssue = {
  line: number;
  name: string | null;
  message: string;
};

export type ImportPatientsResult = {
  dryRun: boolean;
  /** Total de linhas de dados no arquivo (sem o cabeçalho). */
  totalRows: number;
  /** Linhas válidas e inéditas — as que serão (ou foram) criadas. */
  created: number;
  /** Amostra do que será criado, para a pessoa conferir o mapeamento. */
  preview: {
    name: string;
    phone: string;
    cpf: string | null;
    email: string | null;
  }[];
  duplicates: ImportRowIssue[];
  errors: ImportRowIssue[];
};

/** Quantas linhas válidas devolvemos como amostra na prévia. */
const PREVIEW_SIZE = 10;

@Injectable()
export class ImportPatientsUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    private readonly patientCsv: PatientCsvService,
  ) {}

  async execute(input: ImportPatientsInput): Promise<ImportPatientsResult> {
    const { headers, records } = parseCsv(decodeCsvBuffer(input.fileBuffer));

    if (records.length === 0) {
      throw new BadRequestException(
        'O arquivo não tem nenhuma linha de paciente além do cabeçalho.',
      );
    }

    if (records.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `O arquivo tem ${records.length} linhas. O limite por importação é ${MAX_IMPORT_ROWS}.`,
      );
    }

    const columns = this.patientCsv.resolveColumns(headers);

    const valid: ExtractedPatient[] = [];
    const errors: ImportRowIssue[] = [];
    const duplicates: ImportRowIssue[] = [];

    // Duplicata dentro do próprio arquivo: acontece direto quando a planilha
    // é o resultado de juntar duas listas.
    const seen = new Map<string, number>();

    for (const record of records) {
      const extracted = this.patientCsv.extract(record, columns);

      if ('message' in extracted) {
        errors.push(extracted);
        continue;
      }

      const key = this.patientCsv.dedupeKey(extracted);
      const firstLine = seen.get(key);

      if (firstLine !== undefined) {
        duplicates.push({
          line: extracted.line,
          name: extracted.name,
          message: `Repetido dentro do arquivo (já aparece na linha ${firstLine}).`,
        });
        continue;
      }

      seen.set(key, extracted.line);
      valid.push(extracted);
    }

    const existing = await this.patientRepository.findExistingKeys({
      tenantId: input.tenantId,
      cpfs: valid
        .map((p) => p.cpf)
        .filter((cpf): cpf is string => cpf !== null),
      phones: valid.map((p) => p.phone),
    });

    const existingCpfs = new Set(
      existing.map((row) => row.cpf).filter((cpf): cpf is string => !!cpf),
    );
    const existingPhones = new Set(existing.map((row) => row.phone));

    const toCreate = valid.filter((patient) => {
      if (patient.cpf && existingCpfs.has(patient.cpf)) {
        duplicates.push({
          line: patient.line,
          name: patient.name,
          message: 'Já existe um paciente com este CPF.',
        });
        return false;
      }

      if (!patient.cpf && existingPhones.has(patient.phone)) {
        duplicates.push({
          line: patient.line,
          name: patient.name,
          message: 'Já existe um paciente com este telefone.',
        });
        return false;
      }

      return true;
    });

    // Ordena por linha: a pessoa lê o relatório junto com a planilha aberta,
    // e as duplicatas foram coletadas em duas passagens diferentes.
    duplicates.sort((a, b) => a.line - b.line);

    if (!input.dryRun && toCreate.length > 0) {
      await this.patientRepository.createMany(
        toCreate.map((patient) => ({
          tenantId: input.tenantId,
          name: patient.name,
          phone: patient.phone,
          cpf: patient.cpf,
          email: patient.email,
        })),
      );
    }

    return {
      dryRun: input.dryRun,
      totalRows: records.length,
      created: toCreate.length,
      preview: toCreate.slice(0, PREVIEW_SIZE).map((patient) => ({
        name: patient.name,
        phone: patient.phone,
        cpf: patient.cpf,
        email: patient.email,
      })),
      duplicates,
      errors,
    };
  }
}
