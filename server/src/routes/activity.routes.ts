import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ActivityLog } from '../models/activity-log.model';
import { UserActivitySummary } from '../models/user-summary.model';

const router = Router();

/**
 * Validation rules for activity log
 */
const activityLogValidation = [
  body('username').isString().trim().notEmpty().withMessage('Username is required'),
  body('fileName').isString().trim().notEmpty().withMessage('File name is required'),
  body('filePath').isString().trim().notEmpty().withMessage('File path is required'),
  body('date').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date format'),
  body('time').isString().matches(/^\d{2}:\d{2}:\d{2}$/).withMessage('Invalid time format'),
  body('timestamp').isISO8601().withMessage('Invalid timestamp'),
  body('actionType').isIn(['typing', 'paste']).withMessage('Invalid action type'),
  body('typedLines').isInt({ min: 0 }).withMessage('Typed lines must be non-negative'),
  body('pastedLines').isInt({ min: 0 }).withMessage('Pasted lines must be non-negative'),
  body('totalLines').isInt({ min: 0 }).withMessage('Total lines must be non-negative'),
  body('editorVersion').isString().trim().notEmpty().withMessage('Editor version is required'),
];

/**
 * POST /api/activity
 * Create a single activity log entry
 */
router.post('/activity', activityLogValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Create activity log
    const activityLog = new ActivityLog(req.body);
    await activityLog.save();

    // Update user summary
    await updateUserSummary(
      req.body.username,
      req.body.date,
      req.body.typedLines,
      req.body.pastedLines,
      req.body.filePath
    );

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: activityLog,
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/activity/batch
 * Create multiple activity log entries
 */
router.post('/activity/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Logs array is required and must not be empty',
      });
      return;
    }

    // Insert all logs
    const createdLogs = await ActivityLog.insertMany(logs);

    // Update summaries for each unique user-date combination
    const summaryUpdates = new Map<string, { typed: number; pasted: number; files: Set<string> }>();

    for (const log of logs) {
      const key = `${log.username}:${log.date}`;
      if (!summaryUpdates.has(key)) {
        summaryUpdates.set(key, { typed: 0, pasted: 0, files: new Set() });
      }
      const summary = summaryUpdates.get(key)!;
      summary.typed += log.typedLines;
      summary.pasted += log.pastedLines;
      summary.files.add(log.filePath);
    }

    // Update each summary
    for (const [key, data] of summaryUpdates.entries()) {
      const [username, date] = key.split(':');
      await updateUserSummary(username, date, data.typed, data.pasted, '', data.files.size);
    }

    res.status(201).json({
      success: true,
      message: `${createdLogs.length} activity logs created successfully`,
      count: createdLogs.length,
    });
  } catch (error) {
    console.error('Error creating batch activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/summary/:username/:date
 * Get user summary for a specific date
 */
router.get('/summary/:username/:date', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, date } = req.params;

    const summary = await UserActivitySummary.findOne({ username, date });

    if (!summary) {
      res.status(404).json({
        success: false,
        message: 'No summary found for the specified user and date',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/activity/:username
 * Get activity logs for a user (with optional date filter)
 */
router.get('/activity/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const { date, limit = 100, skip = 0 } = req.query;

    const query: any = { username };
    if (date) {
      query.date = date;
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Helper function to update user summary
 */
async function updateUserSummary(
  username: string,
  date: string,
  typedLines: number,
  pastedLines: number,
  filePath: string,
  filesCount?: number
): Promise<void> {
  const update: any = {
    $inc: {
      totalTypedLines: typedLines,
      totalPastedLines: pastedLines,
    },
  };

  // If filesCount is provided (batch update), use it
  if (filesCount !== undefined) {
    update.$inc.totalFilesEdited = filesCount;
  } else if (filePath) {
    // For single updates, increment by 1 if file is new
    update.$addToSet = { files: filePath };
  }

  const summary = await UserActivitySummary.findOneAndUpdate(
    { username, date },
    update,
    { upsert: true, new: true }
  );

  // Calculate ratio
  if (summary) {
    const ratio =
      summary.totalPastedLines === 0
        ? summary.totalTypedLines
        : summary.totalTypedLines / summary.totalPastedLines;
    summary.typingToPastingRatio = Number(ratio.toFixed(2));
    await summary.save();
  }
}

export default router;
