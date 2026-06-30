import { AnimatePresence, motion } from 'framer-motion';

type CheckInBubbleProps = {
  message: string;
  visible: boolean;
};

export function CheckInBubble({ message, visible }: CheckInBubbleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="checkin-bubble speech-bubble-text"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.22 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
