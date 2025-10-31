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
  body('date').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date format (expected YYYY-MM-DD)'),
  body('time').isString().matches(/^\d{2}:\d{2}:\d{2}$/).withMessage('Invalid time format (expected HH:MM:SS)'),
  body('timestamp').isISO8601().withMessage('Invalid timestamp (expected ISO8601 format)'),
  body('actionType').isIn(['typing', 'paste', 'delete', 'cut']).withMessage('Invalid action type (typing, paste, delete, cut)'),
  body('typedLines').isInt({ min: 0 }).withMessage('Typed lines must be a non-negative integer'),
  body('pastedLines').isInt({ min: 0 }).withMessage('Pasted lines must be a non-negative integer'),
  body('totalLines').isInt({ min: 0 }).withMessage('Total lines must be a non-negative integer'),
  body('editorVersion')
    .isString()
    .trim()
    .notEmpty()
    .matches(/^\d+\.\d+\.\d+/)
    .withMessage('Editor version is required (expected format: X.Y.Z)'),
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
      res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
      return;
    }

    // Normalize timestamp to UTC
    const timestamp = new Date(req.body.timestamp);
    req.body.timestamp = timestamp.toISOString();

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
      errorCode: 'ACTIVITY_LOG_CREATE_ERROR',
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
        errorCode: 'INVALID_BATCH_INPUT',
      });
      return;
    }

    // Normalize timestamps to UTC for all logs
    const normalizedLogs = logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp).toISOString(),
    }));

    // Insert all logs
    const createdLogs = await ActivityLog.insertMany(normalizedLogs);

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

    // Update each summary - call ONCE per user/date with all totals
    for (const [key, data] of summaryUpdates.entries()) {
      const [username, date] = key.split(':');
      
      // Update summary with total lines for this user/date
      await updateUserSummaryBatch(username, date, data.typed, data.pasted, Array.from(data.files));
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
      errorCode: 'BATCH_CREATE_ERROR',
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
        errorCode: 'SUMMARY_NOT_FOUND',
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
      errorCode: 'SUMMARY_FETCH_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/activity
 * Get all activity logs (with optional filters)
 */
router.get('/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, date, limit = 100, skip = 0 } = req.query;

    const query: any = {};
    if (username) {
      query.username = username;
    }
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
      errorCode: 'ACTIVITY_FETCH_ERROR',
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
      errorCode: 'USER_ACTIVITY_FETCH_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/activity/:id
 * Update an activity log by ID
 */
router.put('/activity/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const updatedLog = await ActivityLog.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      res.status(404).json({
        success: false,
        message: 'Activity log not found',
        errorCode: 'ACTIVITY_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Activity log updated',
      data: updatedLog,
    });
  } catch (error) {
    console.error('Error updating activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'ACTIVITY_UPDATE_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/activity/:id
 * Delete an activity log by ID
 */
router.delete('/activity/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deletedLog = await ActivityLog.findByIdAndDelete(id);

    if (!deletedLog) {
      res.status(404).json({
        success: false,
        message: 'Activity log not found',
        errorCode: 'ACTIVITY_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Activity log deleted',
    });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'ACTIVITY_DELETE_ERROR',
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
 * Helper function to update user summary (for single logs)
 */
async function updateUserSummary(
  username: string,
  date: string,
  typedLines: number,
  pastedLines: number,
  filePath: string
): Promise<void> {
  // Build the update query
  const update: any = {
    $inc: {
      totalTypedLines: typedLines,
      totalPastedLines: pastedLines,
    },
  };

  // Add file to the unique files array
  if (filePath) {
    update.$addToSet = { files: filePath };
  }

  const summary = await UserActivitySummary.findOneAndUpdate(
    { username, date },
    update,
    { upsert: true, new: true }
  );

  // Update totalFilesEdited based on the actual files array length
  // and calculate improved ratio
  if (summary) {
    summary.totalFilesEdited = summary.files.length;
    
    // Improved ratio calculation:
    // - If no pasted lines: ratio is undefined/null (100% typing)
    // - Otherwise: calculate typed/pasted ratio
    if (summary.totalPastedLines === 0) {
      summary.typingToPastingRatio = summary.totalTypedLines > 0 ? Infinity : 0;
    } else {
      const ratio = summary.totalTypedLines / summary.totalPastedLines;
      summary.typingToPastingRatio = Number(ratio.toFixed(2));
    }
    
    await summary.save();
  }
}

/**
 * Helper function to update user summary for batch operations
 */
async function updateUserSummaryBatch(
  username: string,
  date: string,
  typedLines: number,
  pastedLines: number,
  filePaths: string[]
): Promise<void> {
  // Build the update query
  const update: any = {
    $inc: {
      totalTypedLines: typedLines,
      totalPastedLines: pastedLines,
    },
    // Add all files at once using $addToSet with $each
    $addToSet: { files: { $each: filePaths } },
  };

  const summary = await UserActivitySummary.findOneAndUpdate(
    { username, date },
    update,
    { upsert: true, new: true }
  );

  // Update totalFilesEdited and ratio
  if (summary) {
    summary.totalFilesEdited = summary.files.length;
    
    if (summary.totalPastedLines === 0) {
      summary.typingToPastingRatio = summary.totalTypedLines > 0 ? Infinity : 0;
    } else {
      const ratio = summary.totalTypedLines / summary.totalPastedLines;
      summary.typingToPastingRatio = Number(ratio.toFixed(2));
    }
    
    await summary.save();
  }
}

export default router;
