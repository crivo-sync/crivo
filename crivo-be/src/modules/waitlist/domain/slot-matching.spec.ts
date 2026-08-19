import {
  acceptsSlot,
  rankCandidates,
  type OpenSlot,
  type WaitlistCandidate,
} from './slot-matching';

const SLOT: OpenSlot = {
  professionalId: 'pro-1',
  procedureId: 'proc-1',
  startsAt: new Date('2026-08-20T13:00:00Z'),
  endsAt: new Date('2026-08-20T13:30:00Z'),
};

const CANDIDATE: WaitlistCandidate = {
  id: 'w-1',
  procedureId: 'proc-1',
  professionalId: null,
  preferredFrom: null,
  preferredTo: null,
  createdAt: new Date('2026-08-01T10:00:00Z'),
};

describe('acceptsSlot', () => {
  it('aceita quando procedimento bate e não há restrição', () => {
    expect(acceptsSlot(CANDIDATE, SLOT)).toBe(true);
  });

  it('recusa procedimento diferente', () => {
    // A duração da vaga veio do procedimento cancelado; outro pode não caber.
    expect(acceptsSlot({ ...CANDIDATE, procedureId: 'proc-2' }, SLOT)).toBe(
      false,
    );
  });

  describe('profissional', () => {
    it('quem não escolheu aceita qualquer um', () => {
      expect(acceptsSlot({ ...CANDIDATE, professionalId: null }, SLOT)).toBe(
        true,
      );
    });

    it('quem escolheu só aceita o escolhido', () => {
      expect(acceptsSlot({ ...CANDIDATE, professionalId: 'pro-1' }, SLOT)).toBe(
        true,
      );
      expect(acceptsSlot({ ...CANDIDATE, professionalId: 'pro-2' }, SLOT)).toBe(
        false,
      );
    });
  });

  describe('janela de preferência', () => {
    it('recusa vaga antes do início da janela', () => {
      expect(
        acceptsSlot(
          { ...CANDIDATE, preferredFrom: new Date('2026-08-25T00:00:00Z') },
          SLOT,
        ),
      ).toBe(false);
    });

    it('recusa vaga depois do fim da janela', () => {
      expect(
        acceptsSlot(
          { ...CANDIDATE, preferredTo: new Date('2026-08-15T00:00:00Z') },
          SLOT,
        ),
      ).toBe(false);
    });

    it('aceita vaga dentro da janela', () => {
      expect(
        acceptsSlot(
          {
            ...CANDIDATE,
            preferredFrom: new Date('2026-08-18T00:00:00Z'),
            preferredTo: new Date('2026-08-22T00:00:00Z'),
          },
          SLOT,
        ),
      ).toBe(true);
    });

    it('janela aberta dos dois lados aceita qualquer data', () => {
      expect(
        acceptsSlot(
          { ...CANDIDATE, preferredFrom: null, preferredTo: null },
          SLOT,
        ),
      ).toBe(true);
    });
  });
});

describe('rankCandidates', () => {
  it('ordena por chegada — quem entrou primeiro tem preferência', () => {
    // Ordem de chegada é uma promessa de justiça: furar a fila por critério
    // interno da clínica é o tipo de coisa que o paciente percebe.
    const ranked = rankCandidates(
      [
        { ...CANDIDATE, id: 'novo', createdAt: new Date('2026-08-05') },
        { ...CANDIDATE, id: 'antigo', createdAt: new Date('2026-08-01') },
        { ...CANDIDATE, id: 'meio', createdAt: new Date('2026-08-03') },
      ],
      SLOT,
    );

    expect(ranked.map((c) => c.id)).toEqual(['antigo', 'meio', 'novo']);
  });

  it('descarta quem não serve para a vaga', () => {
    const ranked = rankCandidates(
      [
        { ...CANDIDATE, id: 'serve' },
        { ...CANDIDATE, id: 'outro-procedimento', procedureId: 'proc-9' },
        { ...CANDIDATE, id: 'outro-profissional', professionalId: 'pro-9' },
      ],
      SLOT,
    );

    expect(ranked.map((c) => c.id)).toEqual(['serve']);
  });

  it('devolve vazio quando ninguém serve', () => {
    expect(
      rankCandidates([{ ...CANDIDATE, procedureId: 'proc-9' }], SLOT),
    ).toEqual([]);
  });
});
