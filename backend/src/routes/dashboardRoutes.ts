import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(requireAuth);

router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalAnnouncements,
      requiresReview,
      readyToGenerate,
      finalizedThisMonth,
      byMovementType,
      recentAnnouncements,
      upcomingEffectiveDates,
      recentExtractions,
    ] = await Promise.all([
      prisma.announcement.count(),
      prisma.announcement.count({ where: { status: "RequiresReview" } }),
      prisma.announcement.count({ where: { status: "ReadyToGenerate" } }),
      prisma.announcement.count({
        where: { status: { in: ["Finalized", "Published"] }, updatedAt: { gte: startOfMonth } },
      }),
      prisma.announcement.groupBy({ by: ["movementType"], _count: { _all: true } }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 7,
        include: { employees: true, signatory: true },
      }),
      prisma.announcementEmployee.findMany({
        where: { effectiveDate: { gte: now, lte: in30Days } },
        orderBy: { effectiveDate: "asc" },
        take: 10,
        include: { announcement: true },
      }),
      prisma.movementForm.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    res.json({
      kpis: {
        totalAnnouncements,
        requiresReview,
        readyToGenerate,
        finalizedThisMonth,
      },
      movementDistribution: byMovementType.map((g) => ({
        movementType: g.movementType,
        count: g._count._all,
      })),
      recentAnnouncements,
      upcomingEffectiveDates,
      recentExtractions,
    });
  })
);

export default router;
