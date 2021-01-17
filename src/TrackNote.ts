export class TrackNote {
  constructor(
    readonly when: number,
    readonly pitch: number,
    readonly duration: number,
    readonly slides: never[]
  ) {}
}
