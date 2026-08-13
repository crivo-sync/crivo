import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PatientsModule } from './modules/patients/patients.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { PublicBookingModule } from './modules/public-booking/public-booking.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BillingModule } from './modules/billing/billing.module';
import { TrialModule } from './modules/trial/trial.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            transport: !isProduction
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                    ignore: 'pid,hostname',
                    singleLine: true,
                    messageFormat: '{req.method} {req.url} - {msg}',
                  },
                }
              : undefined,
            level: !isProduction ? 'debug' : 'info',
            autoLogging: {
              ignore: (req) => req.url === '/health' || req.url === '/metrics',
            },
            serializers: {
              req(req) {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  query: req.query,
                  params: req.params,
                  // Não logar o body em produção por segurança
                  ...(!isProduction && {
                    body: req.raw.body,
                  }),
                };
              },
              res(res) {
                return {
                  statusCode: res.statusCode,
                };
              },
            },
          },
        };
      },
    }),
    // Primeiro uso de cron no projeto (expiração de trial).
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 100, // 100 requisições por minuto
      },
    ]),
    AuthModule,
    TenantsModule,
    UsersModule,
    PatientsModule,
    ProfessionalsModule,
    ProceduresModule,
    AppointmentsModule,
    MessagingModule,
    MedicalRecordsModule,
    DashboardModule,
    PredictionModule,
    WaitlistModule,
    PublicBookingModule,
    BillingModule,
    TrialModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
