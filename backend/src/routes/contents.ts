import { Router } from 'express';
import { listContents } from '../controllers/contentController';

const router = Router();

// 阶段一先接一个最简单的"查列表"，用来验证数据库连通；
// 真正的筛选参数、创建接口在阶段二补上。
router.get('/', listContents);

export default router;
