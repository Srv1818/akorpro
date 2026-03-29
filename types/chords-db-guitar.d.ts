declare module "@tombatossals/chords-db/src/db/guitar/index.js" {
  type GuitarChordPosition = {
    frets: string;
    fingers: string;
    barres?: number;
    capo?: boolean;
  };

  type GuitarChordDef = {
    key: string;
    suffix: string;
    positions: GuitarChordPosition[];
  };

  const guitarDb: {
    chords: Record<string, GuitarChordDef[]>;
    main: unknown;
    tunings: unknown;
    keys: unknown;
    suffixes: unknown;
  };

  export default guitarDb;
}
