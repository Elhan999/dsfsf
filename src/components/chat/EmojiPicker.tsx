'use client';

import { useEffect, useRef, useState } from 'react';
import { FiSmile } from 'react-icons/fi';
import { IconButton } from '@/components/ui/Button';
import styles from './Chat.module.scss';

const EMOJIS = ['😀', '😂', '🥹', '😍', '🤔', '😎', '🙌', '👏', '👍', '👎', '🔥', '🚀', '🎉', '💯', '❤️', '✅', '👀', '💡', '🛠️', '🐛', '☕', '🙏', '💪', '✨'];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={styles.emojiWrap} ref={ref}>
      <IconButton type="button" label="Emoji" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <FiSmile />
      </IconButton>
      {open && (
        <div className={styles.emojiMenu} role="menu">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(e);
                setOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
