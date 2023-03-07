import { getTour, putTour } from "./api";
import { TourModel } from "./data";

const saveAfterMs = 512;

export class TourDb {
  private id: string;
  private lastSave: number = 0;
  private current: TourModel | undefined;
  private onSave: () => void;

  constructor(id: string, { onSave = () => {} }: { onSave?: () => void } = {}) {
    this.id = id;
    this.onSave = onSave;
  }

  async load(): Promise<TourModel> {
    return await getTour(this.id);
  }

  set(val: TourModel) {
    this.current = val;

    if (Date.now() - this.lastSave > saveAfterMs) {
      this.lastSave = Date.now();
      this.startSave();
    } else {
      setTimeout(() => {
        // checking if still haven't saved due to any other changes. this ensures we save
        // at least every 2*saveAfterMs.
        if (Date.now() - this.lastSave > saveAfterMs) {
          this.lastSave = Date.now();
          this.startSave();
        }
      }, saveAfterMs);
    }
  }

  private startSave() {
    this.save().catch(err => console.error(err));
  }

  private async save() {
    await putTour(this.id, this.current!);
    this.onSave();
  }
}
