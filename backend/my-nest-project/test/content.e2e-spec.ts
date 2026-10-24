import { createTestApp, type TestContext } from './helpers/test-app.js';

const doc = (text: string) => ({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Intro' }] },
    { type: 'paragraph', content: [{ type: 'text', text }] },
  ],
});

describe('Content API (e2e)', () => {
  let ctx: TestContext;
  let auth: { authorization: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    const { token } = await ctx.login();
    auth = { authorization: `Bearer ${token}` };
  });
  afterAll(() => ctx.close());

  describe('authorization', () => {
    it.each([
      ['post', '/api/v1/projects'],
      ['patch', '/api/v1/projects/reorder'],
      ['post', '/api/v1/blog'],
      ['get', '/api/v1/blog/admin'],
      ['patch', '/api/v1/profile'],
      ['patch', '/api/v1/settings'],
      ['post', '/api/v1/media/signature'],
      ['get', '/api/v1/media'],
      ['get', '/api/v1/contact'],
      ['get', '/api/v1/dashboard/stats'],
    ] as const)('%s %s requires an admin token', async (method, path) => {
      await ctx.http()[method](path).send({}).expect(401);
    });
  });

  describe('validation', () => {
    it('rejects unknown fields and reports details', async () => {
      const res = await ctx
        .http()
        .post('/api/v1/projects')
        .set(auth)
        .send({ title: 'X', summary: 'Y', isAdmin: true })
        .expect(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error.details)).toContain('isAdmin');
    });

    it('rejects malformed ids and URLs', async () => {
      await ctx.http().patch('/api/v1/projects/not-an-id').set(auth).send({}).expect(400);
      await ctx
        .http()
        .post('/api/v1/projects')
        .set(auth)
        .send({ title: 'X', summary: 'Y', liveUrl: 'javascript:alert(1)' })
        .expect(400);
    });

    it('rejects image references to media that does not exist', async () => {
      await ctx
        .http()
        .post('/api/v1/projects')
        .set(auth)
        .send({ title: 'X', summary: 'Y', cover: { mediaId: '6500000000000000000000aa' } })
        .expect(400);
    });
  });

  describe('projects', () => {
    it('hides unpublished projects from public endpoints', async () => {
      const created = await ctx
        .http()
        .post('/api/v1/projects')
        .set(auth)
        .send({ title: 'Hidden project', summary: 'Not yet' })
        .expect(201);
      const { id, slug } = created.body.data;
      expect(slug).toBe('hidden-project');

      await ctx.http().get(`/api/v1/projects/${slug}`).expect(404);
      const list = await ctx.http().get('/api/v1/projects').expect(200);
      expect(list.body.data.items).toHaveLength(0);

      await ctx.http().patch(`/api/v1/projects/${id}/status`).set(auth).send({ published: true }).expect(200);
      const detail = await ctx.http().get(`/api/v1/projects/${slug}`).expect(200);
      expect(detail.body.data.title).toBe('Hidden project');
    });

    it('enforces unique slugs and reserved words', async () => {
      await ctx
        .http()
        .post('/api/v1/projects')
        .set(auth)
        .send({ title: 'Dup', summary: 's', slug: 'hidden-project' })
        .expect(409);
      await ctx
        .http()
        .post('/api/v1/projects')
        .set(auth)
        .send({ title: 'Reserved', summary: 's', slug: 'featured' })
        .expect(400);
    });

    it('persists reorder', async () => {
      const a = await ctx.http().post('/api/v1/projects').set(auth).send({ title: 'A', summary: 's', published: true });
      const b = await ctx.http().post('/api/v1/projects').set(auth).send({ title: 'B', summary: 's', published: true });
      await ctx
        .http()
        .patch('/api/v1/projects/reorder')
        .set(auth)
        .send({ ids: [b.body.data.id, a.body.data.id] })
        .expect(200);
      const list = await ctx.http().get('/api/v1/projects').expect(200);
      const titles = list.body.data.items.map((p: { title: string }) => p.title);
      expect(titles.indexOf('B')).toBeLessThan(titles.indexOf('A'));
    });
  });

  describe('blog drafts and publishing', () => {
    let postId: string;

    it('creates a draft that is invisible publicly', async () => {
      const res = await ctx
        .http()
        .post('/api/v1/blog')
        .set(auth)
        .send({ title: 'Draft post', content: doc('Secret words') })
        .expect(201);
      postId = res.body.data.id;
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.toc).toEqual([{ id: 'intro', text: 'Intro', level: 2 }]);

      await ctx.http().get('/api/v1/blog/draft-post').expect(404);
      const list = await ctx.http().get('/api/v1/blog').expect(200);
      expect(list.body.data.items).toHaveLength(0);
      const search = await ctx.http().get('/api/v1/blog?search=secret').expect(200);
      expect(search.body.data.items).toHaveLength(0);
    });

    it('lets the admin preview unsaved content without publishing', async () => {
      const res = await ctx
        .http()
        .post(`/api/v1/blog/${postId}/preview`)
        .set(auth)
        .send({ content: doc('Preview only') })
        .expect(201);
      expect(res.body.data.html).toContain('Preview only');
      await ctx.http().get('/api/v1/blog/draft-post').expect(404);
    });

    it('keeps scheduled posts private until their date', async () => {
      const future = new Date(Date.now() + 86_400_000).toISOString();
      await ctx
        .http()
        .patch(`/api/v1/blog/${postId}/status`)
        .set(auth)
        .send({ status: 'scheduled', publishedAt: '2000-01-01T00:00:00Z' })
        .expect(400);
      const res = await ctx
        .http()
        .patch(`/api/v1/blog/${postId}/status`)
        .set(auth)
        .send({ status: 'scheduled', publishedAt: future })
        .expect(200);
      expect(res.body.data.status).toBe('scheduled');
      await ctx.http().get('/api/v1/blog/draft-post').expect(404);
    });

    it('publishes immediately and exposes sanitized HTML but not the raw JSON', async () => {
      const res = await ctx
        .http()
        .patch(`/api/v1/blog/${postId}/status`)
        .set(auth)
        .send({ status: 'published' })
        .expect(200);
      expect(res.body.data.status).toBe('published');

      const pub = await ctx.http().get('/api/v1/blog/draft-post').expect(200);
      expect(pub.body.data.html).toContain('<h2 id="intro">');
      expect(pub.body.data.content).toBeUndefined();
      expect(pub.body.data.contentText).toBeUndefined();

      const search = await ctx.http().get('/api/v1/blog?search=secret').expect(200);
      expect(search.body.data.items).toHaveLength(1);
    });

    it('unpublishing removes it from public endpoints again', async () => {
      await ctx.http().patch(`/api/v1/blog/${postId}/status`).set(auth).send({ status: 'draft' }).expect(200);
      await ctx.http().get('/api/v1/blog/draft-post').expect(404);
    });

    it('rejects content that is not a Tiptap document', async () => {
      await ctx
        .http()
        .patch(`/api/v1/blog/${postId}`)
        .set(auth)
        .send({ content: { type: 'paragraph' } })
        .expect(400);
    });
  });

  describe('experience and companies', () => {
    it('populates companies and refuses to delete a company still in use', async () => {
      const company = await ctx
        .http()
        .post('/api/v1/companies')
        .set(auth)
        .send({ name: 'Acme' })
        .expect(201);
      const companyId = company.body.data.id;
      await ctx
        .http()
        .post('/api/v1/experience')
        .set(auth)
        .send({ company: companyId, title: 'Engineer', startDate: '2022-01-01', current: true })
        .expect(201);
      await ctx
        .http()
        .post('/api/v1/experience')
        .set(auth)
        .send({ company: companyId, title: 'Bad dates', startDate: '2022-01-01', endDate: '2021-01-01' })
        .expect(400);

      const list = await ctx.http().get('/api/v1/experience').expect(200);
      expect(list.body.data[0].company.name).toBe('Acme');
      await ctx.http().delete(`/api/v1/companies/${companyId}`).set(auth).expect(409);
    });
  });

  describe('contact form', () => {
    it('accepts a genuine message and silently drops honeypot submissions', async () => {
      const base = {
        name: 'Jamie',
        email: 'jamie@example.com',
        message: 'Hello, I would like to work together.',
        startedAt: Date.now() - 10_000,
      };
      await ctx.http().post('/api/v1/contact').send(base).expect(202);
      await ctx.http().post('/api/v1/contact').send({ ...base, website: 'spam.biz' }).expect(202);
      await ctx.http().post('/api/v1/contact').send({ ...base, email: 'nope' }).expect(400);

      const inbox = await ctx.http().get('/api/v1/contact').set(auth).expect(200);
      expect(inbox.body.data.items).toHaveLength(1);
    });
  });

  describe('media', () => {
    it('reports clearly when Cloudinary is not configured', async () => {
      const res = await ctx
        .http()
        .post('/api/v1/media/signature')
        .set(auth)
        .send({ folder: 'projects' })
        .expect(503);
      expect(res.body.error.message).toMatch(/Cloudinary is not configured/);
    });

    it('only signs uploads into allowed folders', async () => {
      await ctx.http().post('/api/v1/media/signature').set(auth).send({ folder: '../etc' }).expect(400);
    });
  });
});
