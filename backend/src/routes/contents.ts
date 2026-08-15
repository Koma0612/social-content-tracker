import { Router } from 'express';
import {
  listContents,
  createContent,
  getContent,
  getContentHistory,
  transitionContentStatus,
} from '../controllers/contentController';

const router = Router();

router.get('/', listContents);
router.post('/', createContent);
router.get('/:id', getContent);
router.get('/:id/history', getContentHistory);
router.patch('/:id/status', transitionContentStatus);

export default router;
