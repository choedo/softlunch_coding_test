# 🚀 Softlunch Frontend/Flutter

본 레포지토리는 소프트런치 웹 프론트엔드 & Flutter 앱 개발자 포지션 과제 수행 결과물입니다.

## 📌 목차

1. [MISSION 1 — 레거시 코드 진단 및 리팩토링](#mission1)
2. [MISSION 2 - 트레이드오프 분석과 선택](#mission2)
3. [MISSION 3 - 커스텀 제약 하의 Validation 엔진](#mission3)

---

<div id="mission1"></div>

## MISSION 1 — 레거시 코드 진단 및 리팩토링

### [원인 1]

#### 문제 설명

> `useEffect` 내에서 `fetchPosts`와 `fetchUser`가 각각 독립적으로 비동기로 실행되고, 완료 시점마다 `setPosts`, `setLoading`, `setUser`가 개별적으로 호출되어 환경에 따라 여러 번의 개별 렌더링 흐름을 유발할 수 있다.

**AI가 제안한 해결책**
`Promise.all()`을 사용하여 독립적인 비동기 작업을 병렬로 처리할 것.

**내가 채택한 방식 및 이유**
`Promise.all()`을 활용한 병렬 데이터 패칭 방식을 채택했습니다.

1. **로딩 시간 단축:** 두 API 호출을 동시에 시작함으로써, 전체 대기 시간을 가장 오래 걸리는 API의 시간으로 단축.
2. **상태 업데이트 최적화:** React 18 버전 미만일 경우 **자동 배칭(Automatic Batching)** 기능이 도입되지 않아 두 번의 리렌더링이 발생할 수 있으며, `Promise.all()`로 데이터를 한 번에 받아와 처리하면 상태 업데이트 배치 처리하기에 용이하여 불필요한 렌더링 횟수 감소.
3. **원자적 처리:** 페이지 구성에 필요한 핵심 데이터가 모두 도착했을 때 로딩 상태를 해제함으로써 화면 구성 요소가 하나씩 툭툭 끊겨서 나타나는 **레이아웃 시프트** 현상을 방지하고 더 매끄러운 UX를 구현.

```javascript
useEffect(() => {
  setLoading(true);

  Promise.all([fetchPosts(userId, categoryId), fetchUser(userId)]).then(
    ([postsData, userData]) => {
      setPosts(postsData);
      setUser(userData);
      setLoading(false);
    },
  );
}, [userId, categoryId]);
```

**내가 미채택한 방식 및 이유**

1. **`useEffect` 분리 호출:** 각 호출을 별도의 `useEffect`로 분리하는 방식도 고려했으나, 페이지 진입 시점에 유저 정보와 포스트 목록이 모두 필수적인 데이터라면 코드가 더 파편화될 우려가 있습니다. 따라서 한 번의 라이프사이클 내에서 병렬로 관리하는 것이 가독성과 관리 효율성 측면에서 더 우수하다고 판단했습니다.

### [원인 2]

#### 문제 설명

> `sort()` 함수는 원본 배열을 변형시킬 위험이 있고, 렌더링될 때마다 매번 무거운 정렬 작업이 다시 실행된다.

**AI가 제안한 해결책**
`useMemo`를 통해 데이터가 실제로 변경되었을 때만 정렬 로직이 수행되도록 하여 CPU 연산 낭비를 막고, 복사본 배열을 만들어 정렬.

**내가 채택한 방식 및 이유**
`useMemo`를 활용하여 최적화하였습니다.

1. **연산 비용 절감:** 원본 데이터인 `posts`가 변경되지 않는 한, 이전에 계산된 정렬 결과를 재사용하여 불필요한 CPU 자원 소모를 방지했습니다.
2. **참조 동일성 유지:** `useMemo`를 사용하지 않으면 렌더링마다 새로운 배열 객체가 생성되어, 이를 `props`로 받는 자식 컴포넌트들이 실제 데이터 변화가 없음에도 불필요하게 리렌더링되는 현상이 발생합니다. `useMemo`를 통해 반환되는 배열의 참조값을 고정함으로써 하위 UI 최적화(React.memo 등)가 의도대로 작동하도록 설계했습니다.
3. **안정적인 불변성 관리:** 스프레드 연산자([...])를 활용해 원본 상태를 직접 수정하지 않는 불변 객체 패턴을 적용하여, 리액트의 단방향 데이터 흐름과 상태 예측 가능성을 높였습니다.

```javascript
const sortedPosts = useMemo(() => {
  return [...posts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}, [posts]);
```

**내가 미채택한 방식 및 이유**

1. **`toSorted()` 함수 사용:** 원본 배열을 변경하지 않고 `sort()`함수 보다 미세하게 더 빠르고 메모리 관리에 유리하지만, ES14에 도입된 최신 자바스크립트 표준이라 구형 브라우저나 오래된 실행 환경을 지원해야하는 경우도 존재할 가능성이 있을 수 있어서 입니다.
2. **서버 사이드 정렬:** 단순 최신순 정렬이라면 서버에서 정렬된 데이터를 받아오는 것이 가장 이상적일 수 있으나, `CategoryFilter`컴포넌트의 `onChange`에 따라 정렬 기준을 바꿀 때 추가적인 API 호출 없이 즉각적인 대응이 가능하며, 수만 개 이상의 대량 데이터가 아니라면 클라이언트 자원 활용하는 것이 전체 시스템 아키텍처 측면에서 효율적이라 판단하였습니다.

### [원인 3]

#### 문제 설명

> `handleClick` 및 `onChange` 부분은 `PostListPage` 렌더링 시마다 매번 새로 생성되어, 자식 컴포넌트 입장에서는 함수의 참조값(Reference)이 변경된 것으로 인식, 이로 인해 React.memo 등의 최적화가 무력화되고 자식 컴포넌트들의 **불필요한 리렌더링**이 유발

**AI가 제안한 해결책**
`useCallback`을 통해 함수의 메모리 주소(참조)를 동일하게 유지하여 자식 컴포넌트의 불필요한 렌더링 방지.

**내가 채택한 방식 및 이유**
`useCallback`을 활용하여 최적화하였습니다.

1. **Props의 참조 변화 차단:** `handleClick`과 같이 자식 컴포넌트(PostItem)에 Props로 전달되는 함수가 매번 새로 생성되면, 자식 컴포넌트는 실제 데이터 변화가 없어도 Props가 바뀌었다고 판단하여 리렌더링을 수행합니다.
2. **최적화 도구와의 시너지:** 자식 컴포넌트가 `React.memo`로 감싸져 있을 때, `useCallback`으로 함수의 참조를 고정해야만 비로소 메모이제이션 효과가 발휘됩니다. `useCallback`이 없다면 `React.memo`는 무력화됩니다.

```javascript
const handleClick = useCallback(
  (postId) => {
    onPostClick(postId);
  },
  [onPostClick],
);

const handleCategoryChange = useCallback((id) => {
  console.log(id);
}, []);
```

**내가 미채택한 방식 및 이유**

1. **컴포넌트 외부 추출:** 이벤트 핸들러를 컴포넌트 외부로 추출하는 방식도 고려했으나, 해당 핸들러가 상위에서 전달받은 `onPostClick` 등의 Props와 밀접하게 연관되어 있어 `useCallback` 방식이 코드의 직관성과 유지보수 측면에서 더 적합하다고 판단했습니다.

---

<div id="mission2"></div>

## MISSION 2 — 트레이드오프 분석과 선택

### [채택한 방식]

- **구현 방식 요약:** 순수 `JavaScript`의 `Array.prototype.filter()` 단일 활용 필터링

```javascript
const filteredData1 = data.filter((item) => {
  // 1. 카테고리 (단일 선택: 필터가 없거나, 일치하거나)
  const matchCategory = !filters.category || item.category === filters.category;

  // 2. 날짜 범위
  const matchDate =
    (!filters.startDate || item.date >= filters.startDate) &&
    (!filters.endDate || item.date <= filters.endDate);

  // 3. 좋아요 수 (조건 값 이상인지 확인)
  const matchLikes = !filters.minLikes || item.likes >= filters.minLikes;

  // 4. 최솟값 (숫자 입력)
  const matchValue = !filters.minValue || item.value >= filters.minValue;

  // 5. 검색어 (제목 + 내용 동시 검색, 대소문자 무시)
  const keyword = filters.keyword?.toLowerCase() || '';
  const matchSearch =
    !keyword ||
    item.title.toLowerCase().includes(keyword) ||
    item.content.toLowerCase().includes(keyword);

  // 모든 조건을 AND로 결합
  return matchCategory && matchDate && matchLikes && matchValue && matchSearch;
});
```

- **선택 이유:** Lodash나 기타 유효성 검사 전용 패키지 등 검증된 외부 라이브러리를 사용하는 방식도 충분히 고려해 볼 만합니다. 하지만 프로젝트에 외부 라이브러리 의존성을 추가하게 되면, 향후 라이브러리 지원이 중단되거나 메이저 버전 업데이트 시 호환성 이슈에 대응해야 하는 잠재적 리스크가 발생합니다.

물론 Lodash처럼 생태계에서 탄탄하게 검증된 라이브러리는 도입을 긍정적으로 검토할 수 있으나, 오직 '유효성 검사(Validation)' 로직 하나만을 처리하기 위해 패키지를 통째로 도입하는 것은 불필요하게 앱의 번들(Bundle) 용량을 차지하여 초기 로딩 성능을 저하시킬 수 있다고 판단했습니다. 따라서 외부 의존성을 철저히 배제하고, 가벼우면서도 프로젝트 요구사항에 완벽히 통제 가능한 **순수 JavaScript(Vanilla JS)**만을 이용하여 독자적인 엔진을 구현하는 방식을 채택했습니다.

### [채택하지 않은 방식]

- **구현 방식 요약:** `URLSearchParams`를 활용한 쿼리 파라미터 필터링

```javascript
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const filtersFromURL = {
  category: urlParams.get('category'),
  startDate: urlParams.get('startDate'),
  endDate: urlParams.get('endDate'),
  minLikes: urlParams.get('minLikes')
    ? Number(urlParams.get('minLikes'))
    : null,
  minValue: urlParams.get('minValue')
    ? Number(urlParams.get('minValue'))
    : null,
  keyword: urlParams.get('keyword') || '',
};

const filteredDataURL = data.filter((item) => {
  const matchCategory =
    !filtersFromURL.category || item.category === filtersFromURL.category;

  const matchDate =
    (!filtersFromURL.startDate || item.date >= filtersFromURL.startDate) &&
    (!filtersFromURL.endDate || item.date <= filtersFromURL.endDate);

  const matchLikes =
    !filtersFromURL.minLikes || item.likes >= filtersFromURL.minLikes;
  const matchValue =
    !filtersFromURL.minValue || item.value >= filtersFromURL.minValue;

  const keyword = filtersFromURL.keyword.toLowerCase();
  const matchSearch =
    !keyword ||
    item.title.toLowerCase().includes(keyword) ||
    item.content.toLowerCase().includes(keyword);

  return matchCategory && matchDate && matchLikes && matchValue && matchSearch;
});
```

- **치명적 단점 또는 이 프로젝트에 맞지 않는 이유:**

1. **보안성:** 다이어리 서비스의 특성상 사용자의 검색 기록이나 필터링 조건이 URL에 평문으로 노출되는 것을 방지하고, 브라우저 히스토리에 남지 않도록 하여 사용자의 프라이버시를 보호하고 보안성을 높이는게 더 중요하다고 판단하였습니다.
2. **매끄러운 UX:** 모바일 환경에서 필터 시 매번 URL이 바뀌는 것은 브라우저 뒤로 가기 스택이 과도하게 쌓여 사용자에게 혼란을 초래할 수 있습니다. 뒤로 가기 시 필터 단계가 역재생되는 것보단 이전 페이지로 나가는 것이 더 직관적인 모바일 UX라고 판단했습니다.

### [AI 제안에서 내가 수정한 부분]

- **수정 내용:**

1. **연산 순서 최적화:** 가벼운 비교 연산(카테고리, 수치)을 전면에 배치하고, 비용이 높은 문자열 연산(검색어 포함 확인)을 마지막에 수행하도록 **단락 평가(Short-circuit)** 순서를 조정했습니다.
2. **비즈니스 로직의 외부 추출:** 복잡한 필터링 로직을 순수 함수인 `getFilteredFeeds`로 분리하여 모둘화했습니다.
3. **성능 최적화:**: filter 루프 내부에서 매번 수행되던 `toLowerCase()` 등의 중복 연산을 루프 외부로 추출하였습니다.
4. **구조 분해 할당 및 기본값 전략:** 필터 객체를 구조 분해 할당하여 가독성을 높였으며, 수치형 데이터에는 기본값을 설정하여 안정성을 확보했습니다.

- **수정 이유:**

1. **관심사 분리:** UI 렌더링 로직과 데이터 필터링 로직을 분리하여 각 코드의 역할을 명확히 했습니다. 이는 컴포넌트의 비대화를 막고 유지보수성을 극대화합니다.
2. **테스트 용이성:** 외부로 분리된 순수 함수는 React 환경에 의존하지 않으므로, 다양한 필터 조건에 대해 독립적인 **유닛 테스트(Unit Test)**를 수행하기에 매우 유리한 구조가 됩니다.
3. **성능 최적화:** filter 루프 내부에서 매번 수행되던 `toLowerCase()` 등의 중복 연산을 루프 외부로 추출하여, 대량의 데이터 처리 시 발생할 수 있는 CPU 부하를 최소화했습니다.
4. **가독성 및 안정성 확보:** 필터 객체를 구조 분해 할당하여 코드를 간결하게 만들었으며, 수치형 필터(minLikes 등)나 옵셔널 데이터에 기본값(Default parameter) 처리를 적용하여 `undefined`나 `null`로 인한 런타임 에러를 원천 차단했습니다.

---

<div id="mission3"></div>

## MISSION 3 - 커스텀 제약 하의 Validation 엔진

### [버그 1]

- **어느 줄에서 발생하는가?**
  AI가 작성한 validate 함수 내부의 반환문

  ```javascript
  return '최소 ${rule.minLength}자 이상 입력하세요.';

  return '최대 ${rule.maxLength}자까지 입력 가능합니다.';
  ```

- **어떤 상황에서 문제가 생기는가?**
  사용자가 최소 글자 수 미만으로 입력했을 때 에러 메시지에 실제 숫자가 아닌 ${rule.minLength} 라는 문자열이 그대로 노출된다.
  사용자가 최대 글자 수 이상으로 입력했을 때 에러 메시지에 실제 숫자가 아닌 ${rule.maxLength} 라는 문자열이 그대로 노출된다.

- **수정된 코드:**

  ```javascript
  return `최소 ${rule.minLength}자 이상 입력하세요.`;

  return `최소 ${rule.maxLength}자 이상 입력하세요.`;
  ```

### [버그 2]

- **어느 줄에서 발생하는가?**
  `validate` 함수 본문 전체

- **어떤 상황에서 문제가 생기는가?**
  명세에는 maxLength, maxCount, pattern, type, min, max 등 다양한 규칙이 주어졌으나 AI 코드는 이를 전혀 처리하지 못합니다.

- **수정된 코드:**

  ```javascript
  export function validate(value: any, rule: any): string {
  if (!rule) return '';

  const isEmpty =
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

  for (const [ruleKey, ruleValue] of Object.entries(rule)) {
  let isValid = true;
  let errorMessage = '';

      switch (ruleKey) {
        case 'required': {
          if (ruleValue) {
            isValid = !isEmpty;
            errorMessage = '필수 입력 항목입니다.';
          }
          break;
        }
        case 'minLength': {
          if (!isEmpty) {
            isValid = String(value).length >= (ruleValue as number);
            errorMessage = `최소 ${ruleValue}자 이상 입력하세요.`;
          }
          break;
        }
        case 'maxLength': {
          if (!isEmpty) {
            isValid = String(value).length <= (ruleValue as number);
            errorMessage = `최대 ${ruleValue}자까지 입력 가능합니다.`;
          }
          break;
        }
        case 'maxCount': {
          isValid = Array.isArray(value) && value.length <= (ruleValue as number);
          errorMessage = `최대 ${ruleValue}개까지만 입력 가능합니다.`;
          break;
        }
        case 'pattern': {
          if (!isEmpty) {
            const regex = new RegExp(ruleValue as string);
            if (Array.isArray(value)) {
              isValid = value.every((item) => regex.test(String(item)));
            } else {
              isValid = regex.test(String(value));
            }
            errorMessage = '형식에 맞지 않습니다.';
          }
          break;
        }
        case 'type': {
          if (ruleValue === 'number' && !isEmpty) {
            isValid = !isNaN(Number(value)) && value !== '';
            errorMessage = '숫자만 입력 가능합니다.';
          }

          break;
        }
        case 'min': {
          if (!isEmpty) {
            isValid = Number(value) >= (ruleValue as number);
            errorMessage = `최소 ${ruleValue} 이상 입력하세요.`;
          }
          break;
        }
        case 'max': {
          if (!isEmpty) {
            isValid = Number(value) <= (ruleValue as number);
            errorMessage = `최대 ${ruleValue}까지 입력 가능합니다.`;
          }
          break;
        }
        default: {
          break;
        }
      }

      if (!isValid) return errorMessage;

  }

  return '';
  }
  ```

### [버그 3]

- **어느 줄에서 발생하는가?**
  `handleChange` 함수 내부의 상태 업데이트 로직

  ```javascript
  setValues({ ...values, [name]: value });
  const error = validate(name, value);
  setErrors({ ...errors, [name]: error });
  ```

- **어떤 상황에서 문제가 생기는가?**
  사용자가 키보드로 타자를 아주 빠르게 치거나, 자동완성 기능 등으로 여러 필드의 값이 거의 동시에 업데이트될 때 발생합니다. setValues나 setErrors에 직접 values 객체를 참조하면, 리액트의 비동기 렌더링 특성상 **아직 업데이트되지 않은 과거의 상태(Stale State)**를 복사하여 덮어씌우게 됩니다. 이로 인해 방금 입력한 글자가 씹히거나, 여러 필드 중 마지막 필드의 값만 업데이트되는 심각한 입력 유실 현상이 생깁니다.

- **수정된 코드:**

  ```javascript
  const handleChange = useCallback(
  (name: keyof T, value: any) => {
    setValues((prev: T) => ({ ...prev, [name]: value }));

    const error = validate(value, rules[name]);
    setErrors((prev: Error) => ({ ...prev, [name]: error }));
  },
  [rules],
  );
  ```

### [버그 4]

- **어느 줄에서 발생하는가?**
  `handleSubmit` 함수 선언부 및 로직 전체

  ```javascript
  const handleSubmit = (e, onSubmit) => {
    e.preventDefault();
    const allErrors = {};
    Object.keys(rules).forEach((name) => {
      allErrors[name] = validate(name, values[name]);
    });
    setErrors(allErrors);
    if (Object.values(allErrors).every((e) => e === '')) {
      onSubmit(values);
    }
  };
  ```

- **어떤 상황에서 문제가 생기는가?**
  이 함수를 컴포넌트에서 `<form onSubmit={handleSubmit(onSubmit)}>` 형태로 사용할 때 두 가지 심각한 결함이 발생합니다.
  1. **즉시 실행 버그:** 함수가 이벤트 핸들러를 반환하지 않기 때문에, 렌더링 시점에 검증 로직이 즉시 실행되어 버립니다.
  2. **새로고침 버그:** HTML 폼의 기본 동작인 **제출 시 새로고침**을 막으려면 브라우저가 넘겨주는 이벤트 객체(`e`)를 받아 `e.preventDefault()`를 호출해야 합니다. 하지만 기존 구조에서는 `e`를 전달받을 수 없어 화면이 새로고침되고, 사용자가 작성 중이던 데이터가 모두 날아갑니다.

- **수정된 코드:**

  ```javascript
  const handleSubmit = useCallback(
    (onSubmit: (data: T) => void) => {
      return (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newErrors: Error = {};

        let isAllValid = true;

        Object.keys(rules).forEach((name) => {
          const err = validate(values[name], rules[name]);
          if (err) {
            newErrors[name] = err;
            isAllValid = false;
          }
        });

        setErrors(newErrors);

        if (isAllValid) onSubmit(values);
      };
    },
    [rules, values],
  );
  ```

---

## 💬 AI 협업 로그

1. MISSION 1 대화 로그 확인 <https://gemini.google.com/share/0d6b7fd33e0e>
2. MISSION 2 대화 로그 확인 <https://gemini.google.com/share/d8a4fb98ebe9>
