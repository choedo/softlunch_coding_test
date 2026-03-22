import React, { useState, useCallback, FormEvent } from 'react';

// ----------------------------------------------------------------------
// 1. Validation 엔진
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 2. 버그가 수정된 커스텀 훅 (useForm)
// ----------------------------------------------------------------------
type Error = Record<string, string>;
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  rules: any,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Error>({});

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev: T) => ({ ...prev, [name]: value }));

      const error = validate(value, rules[name]);
      setErrors((prev: Error) => ({ ...prev, [name]: error }));
    },
    [rules],
  );

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

  return { values, errors, handleChange, handleSubmit };
}
