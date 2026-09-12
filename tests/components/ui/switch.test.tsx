import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { Switch } from '@/src/components/ui/switch';

afterEach(cleanup);

it('supports keyboard toggling and ignores input while disabled', async () => {
  const onCheckedChange = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <Switch aria-label="启用" checked={false} onCheckedChange={onCheckedChange} />,
  );

  await user.tab();
  await user.keyboard(' ');
  expect(onCheckedChange).toHaveBeenCalledWith(true);

  onCheckedChange.mockClear();
  view.rerender(
    <Switch aria-label="启用" checked disabled onCheckedChange={onCheckedChange} />,
  );
  expect(screen.getByRole('switch')).toBeChecked();
  await user.click(screen.getByRole('switch'));
  expect(onCheckedChange).not.toHaveBeenCalled();
});
