import { Router } from 'express';
import {
  listContents,
  createContent,
  getContent,
  getContentHistory,
  transitionContentStatus,
} from '../controllers/contentController';
import { createReview, listReviews } from '../controllers/reviewController';

const router = Router();

router.get('/', listContents);
router.post('/', createContent);
router.get('/:id', getContent);
router.get('/:id/history', getContentHistory);
router.patch('/:id/status', transitionContentStatus);
router.get('/:id/reviews', listReviews);
router.post('/:id/reviews', createReview);

export default router;
