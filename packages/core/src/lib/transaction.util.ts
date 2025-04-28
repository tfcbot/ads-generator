export type SagaStep<T> = {
  execute: () => Promise<T>;
  compensate: () => Promise<void>;
};

export class Saga {
  private steps: SagaStep<any>[] = [];
  private results: any[] = [];
  private completedSteps = 0;

  /**
   * Add a step to the saga
   * @param step The step to add
   * @returns This saga instance for chaining
   */
  addStep<T>(step: SagaStep<T>): Saga {
    this.steps.push(step);
    return this;
  }

  /**
   * Execute all steps in the saga
   * If any step fails, compensate all completed steps in reverse order
   * @returns Results from all steps
   */
  async execute(): Promise<any[]> {
    try {
      for (let i = 0; i < this.steps.length; i++) {
        const result = await this.steps[i].execute();
        this.results.push(result);
        this.completedSteps++;
      }
      return this.results;
    } catch (error) {
      // Compensate all completed steps in reverse order
      await this.compensate();
      throw error; // Re-throw the original error
    }
  }

  /**
   * Compensate (rollback) all completed steps in reverse order
   */
  private async compensate(): Promise<void> {
    for (let i = this.completedSteps - 1; i >= 0; i--) {
      try {
        await this.steps[i].compensate();
      } catch (compensationError) {
        // Log compensation error but continue with other compensations
        console.error(`Compensation for step ${i} failed:`, compensationError);
      }
    }
  }
} 