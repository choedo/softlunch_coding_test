import React, { ChangeEvent } from 'react';
import { useForm } from './mission_03';

// ----------------------------------------------------------------------
// 3. 실제 사용 예시 (PostForm 컴포넌트)
// ----------------------------------------------------------------------
const postRules = {
  title: { required: true, minLength: 5, maxLength: 100 },
  content: { required: true, minLength: 20 },
  tags: { maxCount: 5, pattern: '^[a-zA-Z0-9]+$' },
  likesThreshold: { required: false, type: 'number', min: 0, max: 9999 },
};
const initialData = { title: '', content: '', tags: [], likesThreshold: '' };

export default function PostForm() {
  const { values, errors, handleChange, handleSubmit } = useForm(
    initialData,
    postRules,
  );

  const onSubmit = (data: typeof initialData) => {
    alert('검증 통과! 데이터 전송');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor={'title'}>제목</label>
        <input
          id={'title'}
          name={'title'}
          value={values.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('title', e.target.value)
          }
        />
        {errors.title && (
          <span style={{ color: 'red', fontSize: '12px' }}>{errors.title}</span>
        )}
      </div>

      <div>
        <label htmlFor={'content'}>내용</label>
        <textarea
          id={'content'}
          name={'content'}
          value={values.content}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('content', e.target.value)
          }
        />
        {errors.content && (
          <span style={{ color: 'red', fontSize: '12px' }}>
            {errors.content}
          </span>
        )}
      </div>

      <div>
        <label htmlFor={'tags'}>태그</label>
        <input
          id={'tags'}
          name={'tags'}
          value={values.tags.join(',')}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const tagsArray = e.target.value
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag !== ''); // 빈 문자열 제거

            handleChange('tags', tagsArray);
          }}
        />
        {errors.tags && (
          <span style={{ color: 'red', fontSize: '12px' }}>{errors.tags}</span>
        )}
      </div>

      <div>
        <label htmlFor={'likesThreshold'}>좋아요 제한</label>
        <input
          id={'likesThreshold'}
          name={'likesThreshold'}
          type="number"
          value={values.likesThreshold}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('likesThreshold', e.target.value)
          }
        />
        {errors.likesThreshold && (
          <span style={{ color: 'red', fontSize: '12px' }}>
            {errors.likesThreshold}
          </span>
        )}
      </div>

      <button type="submit">제출</button>
    </form>
  );
}
