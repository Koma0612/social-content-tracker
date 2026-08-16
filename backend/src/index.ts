import express from 'express';
import cors from 'cors';
import contentsRouter from './routes/contents';
import dashboardRouter from './routes/dashboard';

const app = express();
app.use(cors());
// 默认 100kb 对普通接口够用，但 CSV 导入是把文件用 base64 塞进 JSON body 传上来
// (base64 会让体积膨胀约 1/3)，调大一些避免正常大小的表格被误判成"请求体过大"。
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/contents', contentsRouter);
app.use('/api/dashboard', dashboardRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
