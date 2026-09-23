import * as migration_20260923_141041_initial from './20260923_141041_initial';

export const migrations = [
  {
    up: migration_20260923_141041_initial.up,
    down: migration_20260923_141041_initial.down,
    name: '20260923_141041_initial'
  },
];
