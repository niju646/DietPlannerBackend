-- CreateTable
CREATE TABLE `MealPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `weekStart` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MealPlan_userId_idx`(`userId`),
    UNIQUE INDEX `MealPlan_userId_weekStart_key`(`userId`, `weekStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlannedMeal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mealPlanId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `mealType` VARCHAR(191) NOT NULL,
    `mealName` VARCHAR(191) NOT NULL,
    `ingredients` JSON NOT NULL,
    `instructions` JSON NOT NULL,
    `calories` INTEGER NULL,
    `protein` DOUBLE NULL,
    `carbohydrates` DOUBLE NULL,
    `fat` DOUBLE NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlannedMeal_mealPlanId_date_idx`(`mealPlanId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MealPlan` ADD CONSTRAINT `MealPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlannedMeal` ADD CONSTRAINT `PlannedMeal_mealPlanId_fkey` FOREIGN KEY (`mealPlanId`) REFERENCES `MealPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
