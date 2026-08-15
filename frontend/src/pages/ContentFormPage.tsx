import { FormEvent, useState } from 'react';
import { createContent, CreateContentInput } from '../api/client';
import {
  PLATFORMS,
  CONTENT_TYPES,
  CONTENT_FORMATS,
  CONTENT_GOALS,
  CAMPAIGNS,
} from '../constants/options';

const EMPTY_FORM: CreateContentInput = {
  planned_publish_date: '',
  platform: '',
  topic: '',
  content_type: '',
  content_format: '',
  content_goal: '',
  campaign: '',
  language_market: '',
  owner: '',
  copywriting: '',
  material_source: '',
};

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; id: number }
  | { status: 'error'; message: string };

export default function ContentFormPage() {
  const [form, setForm] = useState<CreateContentInput>(EMPTY_FORM);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  function updateField<K extends keyof CreateContentInput>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.platform || !form.topic?.trim()) {
      setSubmitState({ status: 'error', message: '发布平台和选题是必填项' });
      return;
    }

    setSubmitState({ status: 'submitting' });

    try {
      // 空字符串对后端来说没有意义，统一转成 null 再提交
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]),
      ) as CreateContentInput;

      const created = await createContent(payload);
      setSubmitState({ status: 'success', id: created.id });
      setForm(EMPTY_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败，请稍后重试';
      setSubmitState({ status: 'error', message });
    }
  }

  return (
    <div className="form-page">
      <h2>录入内容</h2>
      <p className="hint">
        先填计划阶段的基本信息，制作阶段（文案、素材）也可以先留空，后面再补。
      </p>

      {submitState.status === 'success' && (
        <div className="banner banner-success">
          已保存！内容 ID：{submitState.id}，当前状态：选题
        </div>
      )}
      {submitState.status === 'error' && (
        <div className="banner banner-error">{submitState.message}</div>
      )}

      <form className="content-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            发布平台 <span className="required">*</span>
            <select
              value={form.platform}
              onChange={(e) => updateField('platform', e.target.value)}
            >
              <option value="">请选择</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            选题 <span className="required">*</span>
            <input
              type="text"
              value={form.topic ?? ''}
              onChange={(e) => updateField('topic', e.target.value)}
              placeholder="例如：新品上市预告"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            计划发布日期
            <input
              type="date"
              value={form.planned_publish_date ?? ''}
              onChange={(e) => updateField('planned_publish_date', e.target.value)}
            />
          </label>

          <label>
            负责人
            <input
              type="text"
              value={form.owner ?? ''}
              onChange={(e) => updateField('owner', e.target.value)}
              placeholder="例如：Amy"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            内容类型
            <select
              value={form.content_type ?? ''}
              onChange={(e) => updateField('content_type', e.target.value)}
            >
              <option value="">请选择</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            内容形式
            <select
              value={form.content_format ?? ''}
              onChange={(e) => updateField('content_format', e.target.value)}
            >
              <option value="">请选择</option>
              {CONTENT_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            内容目标
            <select
              value={form.content_goal ?? ''}
              onChange={(e) => updateField('content_goal', e.target.value)}
            >
              <option value="">请选择</option>
              {CONTENT_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label>
            关联 Campaign
            <select
              value={form.campaign ?? ''}
              onChange={(e) => updateField('campaign', e.target.value)}
            >
              <option value="">请选择</option>
              {CAMPAIGNS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            语言与目标市场
            <input
              type="text"
              value={form.language_market ?? ''}
              onChange={(e) => updateField('language_market', e.target.value)}
              placeholder="例如：英语 / 东南亚市场"
            />
          </label>

          <label>
            素材来源
            <input
              type="text"
              value={form.material_source ?? ''}
              onChange={(e) => updateField('material_source', e.target.value)}
              placeholder="例如：海外团队"
            />
          </label>
        </div>

        <label className="form-full">
          文案
          <textarea
            rows={4}
            value={form.copywriting ?? ''}
            onChange={(e) => updateField('copywriting', e.target.value)}
            placeholder="可以先留空，写文案阶段再补"
          />
        </label>

        <button type="submit" disabled={submitState.status === 'submitting'}>
          {submitState.status === 'submitting' ? '保存中…' : '保存'}
        </button>
      </form>
    </div>
  );
}
