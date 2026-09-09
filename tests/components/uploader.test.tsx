import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import Uploader from '@/src/components/uploader';

afterEach(cleanup);

it('allows selecting the same file again and respects disabled state', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  const file = new File(['fixture'], 'example.pdf', { type: 'application/pdf' });
  const view = render(<Uploader accept=".pdf" onChange={onChange} />);
  const input = screen.getByLabelText('选择文件');
  await user.upload(input, file);
  await user.upload(input, file);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange).toHaveBeenLastCalledWith([file]);
  view.rerender(<Uploader disabled onChange={onChange} />);
  await user.upload(input, file);
  expect(onChange).toHaveBeenCalledTimes(2);
});
