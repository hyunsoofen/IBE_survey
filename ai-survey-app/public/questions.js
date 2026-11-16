// 설문 문항 데이터 — 문항을 고치려면 이 파일만 수정하면 됩니다.
// type: single(단일 선택) | likert(5점 척도) | multi(복수 선택, max개까지) | text(주관식, 선택 응답)
// showIf: 응답에 따라 문항을 보여줄지 결정 (A6 '사용하지 않음' → B·C 건너뜀)

export const SURVEY = {
  version: 'v5-2026-11',
  name: 'AI 프런티어 원정',
  title: 'AI 시대, 당신의 일은 어떻게 바뀌었나요?',
  org: 'KAIST AIC 50기 IBE 팀',
  minutes: '2~3분',
  intro:
    'AI가 실제 업무 성과와 회사 성과로 이어지는지, 아낀 시간은 어디로 가는지, 판단과 노하우는 어떻게 기록되고 있는지 알아보는 설문입니다. 응답은 익명으로 처리되며 연구 목적으로만 사용됩니다.',
  aiDefinition:
    "여기서 'AI'는 ChatGPT, Claude, Gemini, Copilot 같은 생성형 AI와 회사가 제공하는 AI 업무 도구를 모두 포함합니다.",
};

export const LIKERT = [
  { v: 1, label: '전혀 아니다', emoji: '🙅' },
  { v: 2, label: '아니다', emoji: '🤔' },
  { v: 3, label: '보통', emoji: '😐' },
  { v: 4, label: '그렇다', emoji: '🙂' },
  { v: 5, label: '매우 그렇다', emoji: '🤩' },
];

const isUser = (a) => a.A6 !== '사용하지 않음';

export const STAGES = [
  {
    id: 'A', emoji: '⛺', icon: 'camp', name: '베이스캠프', title: '개척자 등록',
    desc: '원정에 앞서 개척자 등록부터 해 볼까요?', color: '#3ef0c8',
    questions: [
      { id: 'A1', type: 'single', text: '귀하의 산업은?', options: ['제조', '식품·소비재', 'IT·SW', '금융', '제약·바이오', '건설·소재', '서비스', '기타'] },
      { id: 'A2', type: 'single', text: '귀하의 직무는?', options: ['연구개발', 'SW·IT', '마케팅·기획', '영업', '생산·품질', '전략·경영지원', '기타'] },
      { id: 'A3', type: 'single', text: '직급은?', options: ['사원·대리', '과장·차장', '부장·팀장', '임원'] },
      { id: 'A4', type: 'single', text: '회사 규모는?', options: ['300인 미만', '300~1,000인', '1,000~10,000인', '10,000인 이상'] },
      { id: 'A5', type: 'single', text: '회사가 업무용 AI를 공식 제공하나요?', options: ['예', '일부 부서만', '아니오'] },
      { id: 'A6', type: 'single', text: '업무에 AI를 얼마나 자주 쓰나요?', options: ['거의 매일', '주 2~3회', '월 몇 회', '사용하지 않음'] },
    ],
  },
  {
    id: 'B', emoji: '🏔️', icon: 'ridge', name: '성과의 분수령', title: '과제 성과와 회사 성과',
    desc: '내 일의 속도는 회사 성과까지 흘러내리고 있을까요?', color: '#5fb4ff',
    showIf: isUser,
    questions: [
      { id: 'B1', type: 'likert', text: 'AI로 내 업무가 빨라지거나 쉬워졌다' },
      { id: 'B2', type: 'single', text: 'AI로 주당 절약하는 시간은?', options: ['없음', '1시간 미만', '1~3시간', '3~5시간', '5시간 이상'] },
      { id: 'B3', type: 'likert', text: 'AI 도입 후 우리 팀의 결과물(출시·수주·품질)이 나아졌다' },
      { id: 'B4', type: 'likert', text: 'AI가 회사의 매출이나 이익에 기여하고 있다고 느낀다' },
    ],
  },
  {
    id: 'C', emoji: '🌊', icon: 'river', name: '시간의 강', title: '아낀 시간과 업무 부하',
    desc: 'AI로 아낀 시간은 어느 쪽으로 흘러갔을까요?', color: '#8b7bff',
    showIf: isUser,
    questions: [
      { id: 'C1', type: 'multi', max: 2, text: 'AI로 아낀 시간을 주로 어디에 쓰나요?', options: ['더 많은 일반 업무', '기획·판단 등 고부가 업무', '고객·거래처 접점', '학습·역량 개발', '기록·노하우 정리', '휴식·업무 외', '잘 모르겠다'] },
      { id: 'C2', type: 'single', text: '회사나 상사가 아낀 시간을 어디에 쓸지 제시한 적이 있나요?', options: ['예', '아니오'] },
      { id: 'C3', type: 'likert', text: 'AI 결과물을 검토·수정하는 데 드는 시간이 아낀 시간을 상당 부분 상쇄한다' },
      { id: 'C4', type: 'likert', text: 'AI 도입 후 상사·경영진의 세부 지시나 추가 보고 요청이 늘었다' },
      { id: 'C5', type: 'likert', text: "'AI 활용 실적을 보고·증명하는 일' 자체가 새 업무가 됐다" },
      { id: 'C6', type: 'single', text: '종합하면 AI 도입 후 내 업무량은?', options: ['크게 줄었다', '조금 줄었다', '비슷하다', '조금 늘었다', '크게 늘었다'] },
      { id: 'C7', type: 'single', text: '우리 조직의 AI 활용은 주로 어떻게 시작됐나요?', options: ['현업의 필요에서 자발적으로', '회사·상부의 과제·KPI로', '둘 다 비슷하게', '잘 모르겠다'] },
    ],
  },
  {
    id: 'D', emoji: '🚩', icon: 'flag', name: '깃발 꽂을 땅', title: '차별화와 사람의 역할',
    desc: '모두가 같은 AI를 쓰는 땅에서, 우리만 선점할 수 있는 곳은 어디일까요?', color: '#ff7ac6',
    questions: [
      { id: 'D1', type: 'likert', text: '경쟁사도 우리와 비슷한 AI 도구를 쓰고 있을 것이다' },
      { id: 'D2', type: 'likert', text: 'AI를 쓰는 것만으로는 경쟁사보다 앞서기 어렵다' },
      { id: 'D3', type: 'single', text: '우리 회사가 AI로 앞설 수 있는 것은 무엇이라고 보나요?', options: ['더 좋은 AI 도구', '우리만의 데이터', '직원의 노하우·판단 기준', '고객 접점', '빠른 실행·조직 문화', '잘 모르겠다'] },
      { id: 'D4', type: 'single', text: '내 업무 중 AI가 대신하기 가장 어려운 일은?', options: ['관계·협상', '판단·의사결정', '현장·감각 평가', '책임지는 승인', '문제 정의', '거의 없다'] },
    ],
  },
  {
    id: 'E', emoji: '📓', icon: 'log', name: '탐사 일지', title: '노하우의 기록 실태',
    desc: '당신의 판단과 노하우는 일지에 남아 있나요?', color: '#ffb547',
    questions: [
      { id: 'E1', type: 'likert', text: '내 업무에 필요한 데이터는 한곳에 정리돼 있어 바로 쓸 수 있다' },
      { id: 'E2', type: 'likert', text: '회사 자료는 보안 문제로 AI에 넣기 어렵다' },
      { id: 'E3', type: 'single', text: '내가 내린 중요한 판단(견적·배합·선정 등)을 그 이유와 함께 기록해 둔다', options: ['항상', '가끔', '거의 안 함'] },
      { id: 'E4', type: 'single', text: '그 판단이 맞았는지(결과)를 나중에 함께 확인해 기록한다', options: ['항상', '가끔', '거의 안 함'] },
      { id: 'E5', type: 'likert', text: '베테랑의 노하우가 문서·체크리스트로 정리돼 있다' },
      { id: 'E6', type: 'single', text: '내 판단 기준을 프롬프트·템플릿으로 만들어 AI에 반복 사용한 적이 있나요?', options: ['예', '아니오'] },
      { id: 'E7', type: 'single', text: 'AI 결과가 틀렸을 때, 그 내용을 프롬프트·판단 기준에 다시 반영해 고친다', options: ['항상', '가끔', '거의 안 함'] },
      { id: 'E8', type: 'single', text: '내 업무의 결과가 맞았는지 확인하는 데 보통 얼마나 걸리나요?', options: ['바로 (자동 판정·당일)', '며칠 이내', '몇 주', '몇 달 이상', '확인하기 어렵다'] },
    ],
  },
  {
    id: 'F', emoji: '🏘️', icon: 'settle', name: '정착지 설계', title: '독자 데이터 루프에 대한 의향',
    desc: '마지막 구역. 기록이 쌓일수록 커지는 정착지를 설계해 봅시다.', color: '#7cf29a',
    questions: [
      { id: 'F1', type: 'likert', text: 'AI로 아낀 시간의 일부를 판단·결과 기록과 노하우 정리에 쓸 의향이 있다' },
      { id: 'F2', type: 'likert', text: '기록·노하우 정리가 현재 내 평가에 반영된다' },
      { id: 'F3', type: 'single', text: '기록을 어렵게 하는 가장 큰 이유는?', options: ['시간 부족', '평가에 반영 안 됨', '기록할 도구·양식 없음', '노하우 공개 부담', '필요성 못 느낌', '기타'] },
      { id: 'F4', type: 'multi', max: 2, text: 'AI 시대에 회사가 평가해야 할 것은?', options: ['결과물의 양', '판단·문제 정의의 질', '노하우를 조직 자산으로 남긴 기여', '아낀 시간으로 만든 새 성과', 'AI 활용도'] },
      { id: 'F5', type: 'text', text: 'AI가 일을 오히려 늘리거나 불편하게 한 경험이 있다면 적어 주세요', placeholder: '예) 보고서 초안은 빨라졌는데 검토 요청이 두 배로 늘었다…' },
      { id: 'F6', type: 'text', text: '우리 회사만의 데이터나 노하우 중 AI와 결합하면 가치가 클 것은?', placeholder: '예) 20년치 배합 실험 기록, 영업 현장의 거래처 메모…' },
    ],
  },
];

// 결과 화면의 '개척자 유형' — 참여 보상용 재미 요소이며 분석에는 쓰지 않습니다.
export function pickPersona(a) {
  if (a.A6 === '사용하지 않음')
    return { icon: 'scout', name: '능선 위의 정찰병', desc: '아직 AI의 땅에 발을 들이지 않고 능선에서 지형을 읽는 중. 서두르지 않는 신중파예요.' };
  if (a.E3 === '항상' && a.E4 === '항상')
    return { icon: 'log', name: '프런티어 지도 제작자', desc: '판단과 결과를 함께 남기는 드문 개척자. 당신의 기록이 다음 원정대의 지도가 됩니다.' };
  if (a.C6 === '조금 늘었다' || a.C6 === '크게 늘었다')
    return { icon: 'river', name: '역류를 건넌 개척자', desc: 'AI가 왔는데 일은 더 늘었다! 숫자의 역설을 몸으로 건너온 현장의 증인이에요.' };
  if (a.B2 === '3~5시간' || a.B2 === '5시간 이상')
    return { icon: 'ridge', name: '속도의 개척자', desc: 'AI로 매주 상당한 시간을 되찾는 개척자. 그 시간을 어디에 정착시킬지가 다음 과제예요.' };
  if (Number(a.F1) >= 4)
    return { icon: 'settle', name: '정착지 설계자', desc: '기록과 노하우의 가치를 아는 개척자. 판만 깔리면 바로 마을을 세울 준비가 됐어요.' };
  return { icon: 'compass', name: '신중한 측량사', desc: '필요한 만큼 AI를 쓰며 효과를 냉정하게 재는 개척자예요.' };
}
