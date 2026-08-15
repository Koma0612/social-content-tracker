import express from 'express';
import cors from 'cors';
import { migrate } from './db/migrate';
import contentsRouter from './routes/contents';

// 启动时先确保表结构存在
migrate();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/contents', contentsRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
