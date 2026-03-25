import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import InputLabel from './index';

const meta = {
  title: 'Commons/Input/Label',
  component: InputLabel,
  tags: ['autodocs'],
  args: {
    text: '라벨',
    required: false,
    state: 'default',
    htmlFor: 'storybook-input-label',
  },
  argTypes: {
    text: { control: 'text' },
    required: { control: 'boolean' },
    state: {
      control: 'inline-radio',
      options: ['default', 'error', 'disabled'],
    },
    htmlFor: { control: 'text' },
    className: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const htmlFor = context.args.htmlFor as string | undefined;
      return (
        <div style={{ width: 320 }}>
          <Story />
          {htmlFor ? (
            <input
              id={htmlFor}
              type="text"
              placeholder="연결된 입력 필드(데모)"
              style={{ marginTop: 8, width: '100%', boxSizing: 'border-box' }}
            />
          ) : null}
        </div>
      );
    },
  ],
} satisfies Meta<typeof InputLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  args: {
    htmlFor: undefined,
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      <InputLabel {...args} text="Default" state="default" />
      <InputLabel {...args} text="Error" state="error" />
      <InputLabel {...args} text="Disabled" state="disabled" />
    </div>
  ),
};

export const Required: Story = {
  args: {
    text: '필수 항목',
    required: true,
    state: 'default',
  },
};
