export type ScreenType = 'landing' | 'setup' | 'oath' | 'board' | 'afterglow';

export interface Player {
  name: string;
  role: 'initiator' | 'receiver';
}

export interface GameState {
  currentScreen: ScreenType;
  playerA: Player;
  playerB: Player;
  intensityLimit: 'all' | 'level2' | 'level1'; //尺度偏好: level1 (只要走心) | level2 (适度接触) | all (毫无禁忌)
  currentTurn: 'A' | 'B';
  temperature: number; // 0 - 100
  history: string[]; // List of card IDs completed
  currentCardId: string | null;
  isCardRevealed: boolean;
  scoreAwardedThisTurn: number;
}
