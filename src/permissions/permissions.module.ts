import { Module } from '@nestjs/common';
import { PERMISSIONS_SERVICE } from './permissions.service.interface';
import { EnumPermissionsService } from './enum-permissions.service';

@Module({
  providers: [
    {
      provide: PERMISSIONS_SERVICE,
      useClass: EnumPermissionsService,
    },
  ],
  exports: [PERMISSIONS_SERVICE],
})
export class PermissionsModule {}
