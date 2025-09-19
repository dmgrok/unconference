import { z } from 'zod';

const feedbackSchema = z.object({
  text: z.string().min(1).max(500),
  type: z.enum(['suggestion', 'bug', 'feature', 'ux', 'other']),
  email: z.string().email().optional().nullable(),
  page: z.string(),
  timestamp: z.string()
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validatedData = feedbackSchema.parse(body);

    // Simple file-based storage for now (can upgrade to database later)
    const feedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      userAgent: getHeader(event, 'user-agent'),
      ip: getClientIP(event)
    };

    // Store in feedback log file
    const feedbackPath = process.env.FEEDBACK_FILE_PATH || './data/feedback.jsonl';

    // Ensure directory exists
    const { dirname } = await import('path');
    const { mkdir, appendFile } = await import('fs/promises');

    await mkdir(dirname(feedbackPath), { recursive: true });

    // Append as JSONL (one JSON object per line)
    await appendFile(feedbackPath, JSON.stringify(feedbackEntry) + '\n');

    // Optional: Send to email/Slack if configured
    if (process.env.FEEDBACK_WEBHOOK_URL) {
      try {
        await $fetch(process.env.FEEDBACK_WEBHOOK_URL, {
          method: 'POST',
          body: {
            text: `New feedback: ${validatedData.type}\n${validatedData.text}\nPage: ${validatedData.page}\nEmail: ${validatedData.email || 'None'}`
          }
        });
      } catch (webhookError) {
        console.error('Failed to send webhook:', webhookError);
        // Don't fail the whole request if webhook fails
      }
    }

    return { success: true, message: 'Feedback received' };

  } catch (error) {
    console.error('Feedback submission error:', error);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid feedback data'
    });
  }
});