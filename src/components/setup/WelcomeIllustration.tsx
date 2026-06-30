import { motion } from 'framer-motion';

type WelcomeIllustrationProps = {
  celebrate?: boolean;
};

export function WelcomeIllustration({ celebrate = false }: WelcomeIllustrationProps) {
  return (
    <svg className="welcome-illustration" viewBox="0 0 260 240" role="img" aria-label="Sage seedling mascot growing beside a saver">
      <ellipse cx="130" cy="214" rx="86" ry="14" fill="#ECEAF5" />
      <circle cx="188" cy="62" r="24" fill="#FFD23F" opacity="0.92" />
      <path d="M62 180c12-25 34-40 58-40s48 16 60 40v31H62v-31Z" fill="#6C5CE7" />
      <path d="M89 104c0-28 18-50 43-50s43 22 43 50v31H89v-31Z" fill="#33285F" />
      <circle cx="132" cy="105" r="35" fill="#F8C9A8" />
      <path d="M98 96c11-33 46-42 70-18 3 15 2 26-2 35-13-19-36-21-68-17Z" fill="#33285F" />
      <circle cx="119" cy="108" r="3" fill="#1A1A2E" />
      <circle cx="145" cy="108" r="3" fill="#1A1A2E" />
      <path d="M122 124c8 7 18 7 27 0" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M78 174c-20-3-32-16-36-35" stroke="#F8C9A8" strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M182 173c17-7 27-21 28-40" stroke="#F8C9A8" strokeWidth="15" strokeLinecap="round" fill="none" />
      <rect x="95" y="152" width="72" height="50" rx="25" fill="#FFFFFF" opacity="0.18" />
      <motion.g
        animate={celebrate ? { y: [0, -12, 0], scale: [1, 1.16, 1], rotate: [0, -5, 5, 0] } : { y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 12 }}
      >
        <rect x="183" y="122" width="42" height="52" rx="14" fill="#FFFFFF" stroke="#ECEAF5" strokeWidth="4" />
        <path d="M204 153v-27" stroke="#00B86B" strokeWidth="5" strokeLinecap="round" />
        <path d="M204 139c-12-3-16-11-14-21 11 2 17 9 14 21Z" fill="#00B86B" />
        <path d="M204 145c12-6 17-15 14-26-12 4-17 13-14 26Z" fill="#38D98B" />
        <circle cx="204" cy="170" r="18" fill="#FFD23F" />
        <path d="M197 170h14" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}
