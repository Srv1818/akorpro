import * as migration_20260923_141041_initial from './20260923_141041_initial';
import * as migration_20260929_072717_drop_seo_meta from './20260929_072717_drop_seo_meta';
import * as migration_20260929_074806_song_views from './20260929_074806_song_views';

export const migrations = [
  {
    up: migration_20260923_141041_initial.up,
    down: migration_20260923_141041_initial.down,
    name: '20260923_141041_initial',
  },
  {
    up: migration_20260929_072717_drop_seo_meta.up,
    down: migration_20260929_072717_drop_seo_meta.down,
    name: '20260929_072717_drop_seo_meta',
  },
  {
    up: migration_20260929_074806_song_views.up,
    down: migration_20260929_074806_song_views.down,
    name: '20260929_074806_song_views'
  },
];
