import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const CARD = '#F7F6F3';
const LINE = '#DDD8CF';
const GOLD = '#C4A054';

type Props = { id: string; height: number };

export function OnboardingArt({ id, height }: Props) {
  if (id === '2') return <TaskArt height={height} />;
  if (id === '3') return <QrArt height={height} />;
  return <DiscoverArt height={height} />;
}

function DiscoverArt({ height }: { height: number }) {
  const width = height * (320 / 340);
  return (
    <Svg width={width} height={height} viewBox="0 0 320 340">
      <Rect x={78} y={46} width={164} height={230} rx={28} fill={CREAM} />
      <Path d="M98 108H222" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d="M98 154H222" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d="M98 200H222" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d="M132 78V246" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d="M186 78V246" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
      <Path d="M160 198c0 0-30-34-30-56a30 30 0 0 1 60 0c0 22-30 56-30 56z" fill={NAVY} />
      <Circle cx={160} cy={142} r={9} fill={CREAM} />
      <G>
        <Rect x={18} y={36} width={78} height={78} rx={24} fill={CARD} />
        <Path d="M42 66h22v14a11 11 0 0 1-22 0V66z" stroke={NAVY} strokeWidth={2.5} fill="none" />
        <Path d="M64 70h7a8 8 0 0 1 0 16h-7" stroke={NAVY} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d="M38 96h32" stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" />
      </G>
      <G>
        <Rect x={224} y={78} width={78} height={78} rx={24} fill={CARD} />
        <Circle cx={250} cy={128} r={7} stroke={NAVY} strokeWidth={2.5} fill="none" />
        <Circle cx={276} cy={128} r={7} stroke={NAVY} strokeWidth={2.5} fill="none" />
        <Path d="M255 122 L274 100" stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M271 122 L252 100" stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" />
      </G>
      <G>
        <Rect x={206} y={214} width={78} height={78} rx={24} fill={CARD} />
        <Rect x={226} y={244} width={12} height={20} rx={3} stroke={NAVY} strokeWidth={2.5} fill="none" />
        <Rect x={262} y={244} width={12} height={20} rx={3} stroke={NAVY} strokeWidth={2.5} fill="none" />
        <Path d="M238 254h24" stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

function TaskArt({ height }: { height: number }) {
  const width = height * (320 / 340);
  return (
    <Svg width={width} height={height} viewBox="0 0 320 340">
      <Rect x={46} y={28} width={158} height={286} rx={36} fill={CREAM} />
      <Rect x={60} y={52} width={130} height={228} rx={22} fill={NAVY} />
      <Rect x={76} y={78} width={98} height={14} rx={7} fill={CREAM} opacity={0.9} />
      <Rect x={76} y={106} width={72} height={10} rx={5} fill={CREAM} opacity={0.45} />
      <Rect x={76} y={132} width={98} height={36} rx={10} fill={CREAM} opacity={0.12} />
      <Rect x={76} y={178} width={98} height={36} rx={10} fill={CREAM} opacity={0.12} />
      <Circle cx={94} cy={196} r={6} fill={GOLD} />
      <Rect x={138} y={118} width={156} height={132} rx={22} fill={CARD} />
      <Circle cx={138} cy={184} r={14} fill={NAVY} />
      <Circle cx={294} cy={184} r={14} fill={NAVY} />
      <Path d="M168 168h86" stroke={LINE} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 10" />
      <Circle cx={176} cy={168} r={16} fill={NAVY} />
      <Path d="M169 168l5 5 9-10" stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={204} y={156} width={62} height={8} rx={4} fill={NAVY} opacity={0.85} />
      <Rect x={204} y={172} width={44} height={8} rx={4} fill={NAVY} opacity={0.35} />
    </Svg>
  );
}

function QrArt({ height }: { height: number }) {
  const width = height * (300 / 360);
  return (
    <Svg width={width} height={height} viewBox="0 0 300 360">
      <Rect x={78} y={18} width={168} height={324} rx={38} fill={CREAM} />
      <Rect x={92} y={46} width={140} height={252} rx={18} fill="#FFFFFF" />
      <G fill={NAVY} transform="translate(110 78)">
        <Rect width={28} height={28} />
        <Rect x={8} y={8} width={12} height={12} fill="#fff" />
        <Rect x={76} width={28} height={28} />
        <Rect x={84} y={8} width={12} height={12} fill="#fff" />
        <Rect y={76} width={28} height={28} />
        <Rect x={8} y={84} width={12} height={12} fill="#fff" />
        <Rect x={36} width={8} height={8} />
        <Rect x={52} width={8} height={8} />
        <Rect x={36} y={12} width={8} height={8} />
        <Rect x={52} y={20} width={8} height={8} />
        <Rect x={36} y={36} width={32} height={8} />
        <Rect x={36} y={52} width={8} height={20} />
        <Rect x={52} y={52} width={16} height={8} />
        <Rect x={60} y={64} width={8} height={16} />
        <Rect x={36} y={76} width={8} height={8} />
        <Rect x={52} y={84} width={20} height={8} />
        <Rect x={80} y={36} width={8} height={24} />
        <Rect x={92} y={48} width={12} height={8} />
        <Rect x={8} y={36} width={16} height={8} />
        <Rect x={8} y={52} width={8} height={12} />
        <Rect x={76} y={76} width={20} height={8} />
        <Rect x={88} y={88} width={8} height={16} />
        <Rect x={40} y={96} width={12} height={8} />
      </G>
      <Rect x={148} y={292} width={28} height={6} rx={3} fill={NAVY} opacity={0.35} />
    </Svg>
  );
}
