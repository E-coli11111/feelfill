import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import Switch from '@/src/components/switch';

afterEach(cleanup);

it('supports keyboard toggling and ignores input while disabled', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  const view = render(<Switch enabled={false} text="启用" onChange={onChange} />);
  await user.tab();
  await user.keyboard(' ');
  expect(onChange).toHaveBeenCalledWith(true);
  onChange.mockClear();
  view.rerender(<Switch enabled disabled text="启用" onChange={onChange} />);
  expect(screen.getByRole('switch')).toBeChecked();
  await user.click(screen.getByRole('switch'));
  expect(onChange).not.toHaveBeenCalled();
});
