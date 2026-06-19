-- CreateTable
CREATE TABLE "app_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT NOT NULL,
    "meta" TEXT,

    CONSTRAINT "app_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_records" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "districtName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "rfProb" DOUBLE PRECISION NOT NULL,
    "pytorchProb" DOUBLE PRECISION,
    "riskLevel" TEXT NOT NULL,
    "activeCases" INTEGER NOT NULL DEFAULT 0,
    "newCases" INTEGER NOT NULL DEFAULT 0,
    "growthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "humidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rainfall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mobilityIndex" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modelUsed" TEXT NOT NULL DEFAULT 'ensemble',

    CONSTRAINT "prediction_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_snapshots" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelChoice" TEXT NOT NULL DEFAULT 'ensemble',
    "data" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "nationalActive" INTEGER NOT NULL DEFAULT 0,
    "avgProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highRiskCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prediction_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "districtName" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "activeCases" INTEGER NOT NULL DEFAULT 0,
    "growthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "message" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_screenings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientAge" INTEGER,
    "patientSex" TEXT,
    "districtName" TEXT,
    "muac" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "result" TEXT,
    "confidence" DOUBLE PRECISION,
    "notes" TEXT,
    "imageData" TEXT,

    CONSTRAINT "nutrition_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_status_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "coverage" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "api_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_key" ON "districts"("name");

-- CreateIndex
CREATE INDEX "districts_region_idx" ON "districts"("region");

-- CreateIndex
CREATE INDEX "prediction_records_districtName_idx" ON "prediction_records"("districtName");

-- CreateIndex
CREATE INDEX "prediction_records_createdAt_idx" ON "prediction_records"("createdAt");

-- CreateIndex
CREATE INDEX "alerts_districtName_idx" ON "alerts"("districtName");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- CreateIndex
CREATE INDEX "nutrition_screenings_districtName_idx" ON "nutrition_screenings"("districtName");

-- CreateIndex
CREATE INDEX "nutrition_screenings_createdAt_idx" ON "nutrition_screenings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "prediction_records" ADD CONSTRAINT "prediction_records_districtName_fkey" FOREIGN KEY ("districtName") REFERENCES "districts"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_districtName_fkey" FOREIGN KEY ("districtName") REFERENCES "districts"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_screenings" ADD CONSTRAINT "nutrition_screenings_districtName_fkey" FOREIGN KEY ("districtName") REFERENCES "districts"("name") ON DELETE SET NULL ON UPDATE CASCADE;
