import { Wobject } from './interfaces';

export interface FindParentsByPermlinkFn {
  (permlinks: string[]): Promise<Wobject[]>;
}

export interface GetWaivioAdminsAndOwnerFn {
  (): Promise<string[]>;
}

export interface GetBlacklistFn {
  (admins: string[]): Promise<string[]>;
}

export interface GetObjectsByGroupIdFn {
  (ids: string[]): Promise<Wobject[]>;
}

export interface ObjectProcessorModuleOptions {
  findParentsByPermlink: FindParentsByPermlinkFn;
  getWaivioAdminsAndOwner: GetWaivioAdminsAndOwnerFn;
  getBlacklist: GetBlacklistFn;
  getObjectsByGroupId: GetObjectsByGroupIdFn;
  masterAccount: string;
}

export const OBJECT_PROCESSOR_OPTIONS = 'OBJECT_PROCESSOR_OPTIONS';
