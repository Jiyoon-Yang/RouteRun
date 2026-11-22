import { PRIVACY, TERMS } from './content';

import { LegalDocumentPage } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
  title: 'Legal/LegalDocumentPage',
  component: LegalDocumentPage,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { document: TERMS },
} satisfies Meta<typeof LegalDocumentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Terms: Story = {};

export const Privacy: Story = { args: { document: PRIVACY } };
