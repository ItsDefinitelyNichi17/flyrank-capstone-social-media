export class ScheduleService {
  private isRunning: boolean = false;

  public start(intervalMs = 15000): void {
      console.log('[Scheduler] Started monitoring schedule slots...');
      setInterval(() => this.processDuePosts(), intervalMs);
  }

  private processDuePosts(): void {
    if (this.isRunning) return;
    this.isRunning = true;



    this.isRunning = false;
  }
}
