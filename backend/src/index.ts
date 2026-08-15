import express from 'express';
import cors from 'cors';
import contentsRouter from './routes/contents';
import dashboardRouter from './routes/dashboard';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/contents', contentsRouter);
app.use('/api/dashboard', dashboardRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
