// 녹화용 가상 모둠 기록 — 실제 학생 정보가 아닌 예시 데이터입니다.
const U = 'https://ibook.vivasam.com/CBS_iBook/10703/contents/index.html?skin=basic01';
const S = '비상교육 사회 5-2 · 교과서 발췌';
const rec = (id, name, nation, period, kind, material, fact) => ({ id, base: id, name, nation, period, kind, material, fact, source: S, url: U });
export const SEED = {
  version: 1, school: '모아초등학교', group: '5학년 햇살 모둠',
  records: [
    rec('gold-crown', '황남대총 북분 금관', '신라', '삼국시대', '공예품', '금', '금으로 만든 관이다. 나뭇가지 모양 장식과 달개가 달려 있어 움직이면 반짝였을 것 같다. 무덤에서 나왔고 왕이나 높은 사람이 썼다고 한다.'),
    rec('spoon', '백제의 청동 수저와 사발', '백제', '삼국시대', '생활용품', '청동', '청동으로 만든 숟가락과 젓가락, 사발이다. 백제 사람들도 수저로 밥을 먹었다는 것을 알 수 있다.'),
    rec('armor', '가야의 철 갑옷과 투구', '가야', '삼국시대', '무기', '철', '철판을 이어 만든 갑옷과 투구이다. 가야는 철을 잘 다루었고 싸울 때 몸을 보호했다.'),
    rec('house', '가야의 집 모양 토기', '가야', '삼국시대', '토기', '흙', '기둥 위에 지은 집 모양의 토기이다. 땅에서 띄워 지은 창고나 집이 있었다는 것을 알 수 있다.'),
    rec('figurines', '신라 토우', '신라', '삼국시대', '토기', '흙', '흙으로 빚은 작은 사람 인형이다. 춤추거나 악기를 연주하는 모습이 있어 신라 사람들의 놀이와 생활을 짐작할 수 있다.'),
    rec('pagoda', '익산 미륵사지 석탑', '백제', '7세기', '건축물', '돌', '돌로 쌓은 큰 탑이다. 나무 건물처럼 보이도록 돌을 다듬어 만들었다. 백제 사람들의 믿음과 뛰어난 기술을 보여 준다.'),
  ],
  relations: [
    { id: 'rel-1', from: '가야의 철 갑옷과 투구', to: '공예 기술', label: '철판을 이어 붙인 모습에서 철을 다루는 기술을 알 수 있다', status: '확인한 사실', source: 'armor' },
    { id: 'rel-2', from: '신라 토우', to: '생활 모습', label: '춤추고 악기를 연주하는 모습에서 놀이 문화를 짐작한다', status: '우리의 추측', source: 'figurines' },
    { id: 'rel-3', from: '익산 미륵사지 석탑', to: '믿음', label: '큰 탑을 세운 것에서 불교를 중요하게 여긴 것을 알 수 있다', status: '확인한 사실', source: 'pagoda' },
  ],
  exhibit: ['spoon', 'house', 'figurines', 'armor', 'gold-crown', 'pagoda'],
  checked: ['spoon', 'house', 'figurines', 'armor', 'gold-crown', 'pagoda'],
  answers: {
    'question': '삼국과 가야 사람들은 어떤 물건을 쓰며 살았을까?',
    'question-final': '삼국과 가야 사람들은 어떤 물건을 쓰며 살았을까?',
    'criterion': '쓰임',
    'class-gold-crown': '꾸미는 물건', 'ai-class-gold-crown': '장신구',
    'class-spoon': '먹는 물건', 'ai-class-spoon': '식기',
    'class-armor': '싸우는 물건', 'ai-class-armor': '무기·방어구',
    'class-house': '먹는 물건', 'ai-class-house': '건축 모형',
    'class-figurines': '노는 물건', 'ai-class-figurines': '예술품',
    'class-pagoda': '믿는 물건', 'ai-class-pagoda': '종교 건축물',
    'classify-tool': '선생님과 함께 사용한 생성형 AI · 9월 12일',
    'classify-reason': '집 모양 토기를 우리는 음식을 담는 그릇으로 보았지만, AI는 건축 모형으로 나눴다. 교과서를 다시 읽어 보니 두 가지 쓰임을 모두 생각할 수 있었다.',
    'keywords': '금, 흙, 철, 돌, 사람, 생활',
    'word-meaning': '신라와 가야 자료에는 금과 철처럼 재료를 다루는 기술이 많이 나오고, 흙으로 만든 자료에서는 생활 모습을 알 수 있었다.',
    'word-limit': '우리가 고른 여섯 자료만 세었기 때문에 삼국 전체의 모습이라고 말할 수는 없다.',
    'museum-title': '물건으로 만나는 삼국과 가야의 하루',
    'museum-intro': '밥을 먹고, 집을 짓고, 놀고, 나라를 지키고, 믿음을 가졌던 옛사람들의 하루를 여섯 가지 유물로 따라가 보세요.',
    'final-spoon': '백제 사람들은 청동으로 만든 숟가락과 젓가락으로 밥을 먹었습니다. 오늘날 우리가 쓰는 수저와 모양이 비슷합니다.',
    'final-house': '가야의 집 모양 토기는 기둥 위에 지은 집의 모습을 보여 줍니다. 땅의 습기를 피해 곡식을 보관했을 것으로 보입니다.',
    'final-figurines': '신라 토우는 흙으로 빚은 작은 인형입니다. 춤추고 악기를 연주하는 모습에서 신라 사람들의 놀이를 볼 수 있습니다.',
    'final-armor': '가야는 철을 잘 다루는 나라였습니다. 철판을 이어 만든 갑옷과 투구로 몸을 보호했습니다.',
    'final-gold-crown': '황남대총 북분 금관은 금으로 만든 신라의 관입니다. 나뭇가지 모양 장식이 달려 있어 높은 신분을 보여 줍니다.',
    'final-pagoda': '익산 미륵사지 석탑은 나무 건물처럼 보이게 돌을 다듬어 쌓은 백제의 탑입니다.',
    'guess-figurines': '명절이나 잔치 때 사람들이 모여 노래하고 춤추었을 것 같습니다. 토우의 자세가 근거입니다.',
  },
};
