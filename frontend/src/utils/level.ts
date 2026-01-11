export const calculateLevel = (xp: number) => {
    if (xp < 0) return 1;
    return Math.floor(xp / 100) + 1;
};

export const calculateNextLevelProgress = (xp: number) => {
    if (xp < 0) return 0;
    const currentLevel = Math.floor(xp / 100) + 1;
    const nextLevelXp = currentLevel * 100;
    const currentLevelStartXp = (currentLevel - 1) * 100;

    const xpInCurrentLevel = xp - currentLevelStartXp;
    // Since every level is exactly 100 XP wide:
    const progress = (xpInCurrentLevel / 100) * 100;

    return Math.min(Math.max(progress, 0), 100);
};

export const getXpForNextLevel = (xp: number) => {
    const currentLevel = Math.floor(xp / 100) + 1;
    return currentLevel * 100;
}
