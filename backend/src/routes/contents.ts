import { Router } from 'express';
import { listContents, createContent } from '../controllers/contentController';

const router = Router();

router.get('/', listContents);
router.post('/', createContent);

export default router;
