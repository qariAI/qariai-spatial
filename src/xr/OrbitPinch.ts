// Per-hand recovery gate. Distances and hysteresis match Living Orbit's
// existing gesture; action cooldown remains owned by HandTracking.
export class OrbitPinch {
  pinching = false;
  private armed = false;
  private openSamples = 0;

  loseTracking() {
    this.pinching = false;
    this.armed = false;
    this.openSamples = 0;
  }

  // Two consecutive valid, fully open samples confirm recovery. An already
  // closed or hysteresis-band hand cannot arm or emit a new press.
  update(distance: number): boolean {
    if (!Number.isFinite(distance) || distance < 0) {
      this.loseTracking();
      return false;
    }
    if (!this.armed) {
      this.openSamples = distance >= .038 ? this.openSamples + 1 : 0;
      if (this.openSamples >= 2) this.armed = true;
      return false;
    }
    const previous = this.pinching;
    this.pinching = previous ? distance < .038 : distance < .026;
    return this.pinching && !previous;
  }
}
