# PlainVault Audit — Remaining Tasks

> Generated: 2026-05-08
> Updated: 2026-05-08

---

## COMPLETED

### CRITICAL (5/5)
- **C-1**: 세션 서버 측 스토어 마이그레이션 (불투명 토큰 + DB 세션) ✅
- **C-2**: API 키 스코프 검증 (`files:read_raw`) ✅
- **C-3**: PrismaClient 싱글톤 (`@/lib/db`) ✅
- **C-4**: Rate limiting (login 10/5min, register 5/hr) ✅
- **C-5**: Role/status 검증 상수/함수 추가 ✅

### HIGH (7/7)
- **H-1**: CSRF 보호 (double-submit cookie) ✅
- **H-2**: 의존성 업그레이드 (next/react/sanitize-html 패치, bcryptjs 제거) ✅
- **H-4**: middleware.ts 중앙집중 라우트 보호 ✅
- **H-5**: 보안 헤더 (HSTS, CSP, X-Frame-Options 등) ✅
- **H-6**: 기본 비밀번호 제거 (시드 스크립트) ✅
- **H-7**: 비밀번호 로깅 제거 ✅
- **H-8**: 구조화된 로깅 모듈 (`src/lib/logging/logger.ts`) + API route console.error 교체 ✅

### LOW (6/6)
- **L-1**: `<img>` → `next/image` 교체 ✅
- **L-2**: bcryptjs 제거 (harness.ts에서 argon2로 교체) ✅
- **L-3**: 외래키 인덱스 추가 (createdById, updatedById, categoryId) ✅
- **L-4**: Cascade Delete 추가 (VaultFile, FileRevision, ApiKey 관계) ✅
- **L-5**: 백업/복구 스크립트 (`scripts/backup.sh`, `scripts/restore.sh`) ✅
- **L-6**: Docker Compose 작성 (`docker-compose.yml` + volume) ✅

### MEDIUM (Partial)
- **M-2**: 타임존 처리 (`formatKST()` → `formatDateTime()` with timezone support) ✅
- **M-4**: 인증 패턴 통일 (14개 라우트를 `withAuth()`로 마이그레이션) ✅
- **M-6**: Docker SQLite 볼륨 마운트 (`docker-compose.yml`) ✅
- **M-7**: `/health` 엔드포인트 (`src/app/api/health/route.ts`) ✅
- **M-8**: 구조화된 로깅 (`logger.ts` 모듈 + API route `console.error` → `logger.error`) ✅

---

## BLOCKED

### M-5. Prisma String → Enum 마이그레이션
- **상태**: ❌ **BLOCKED** — SQLite does not support Prisma enums.
- **Prisma 에러**: `The current connector does not support enums`
- **대안**: String 타입 + application-level 검증 (`src/lib/auth/roles.ts`)으로 유지

---

## PENDING (Remaining)

### M-1. i18n (국제화) 도입
- **문제**: 모든 사용자 문자열이 영어로 하드코딩. `lang="en"` 고정.
- **해결**: `next-intl` 도입, 메시지 파일(en/ko/ja) 생성, 로케일 감지
- **영향 파일**: `src/app/layout.tsx`, 모든 TSX 페이지 컴포넌트
- **예상 노력**: 2일
- **상태**: 미시작

### M-3. 접근성(a11y) 개선
- **문제**: aria-* 속성 0개, 키보드 네비게이션 없음, onClick에 키보드 대안 없음
- **현황**: 일부 개선 완료 (dashboard category filter에 aria-pressed/aria-label 추가, search input에 aria-label 추가, delete button에 aria-label 추가)
- **남은 작업**:
  - 관리자 페이지 (admin/users, admin/categories, admin/api-keys)에 aria 속성 추가
  - 키보드 네비게이션 전체 검토
  - axe-core 감사 실행
- **예상 노력**: 4시간
- **상태**: 부분 완료

### H-3. 소스 코드 중복 제거
- **문제**: `src/` (50 파일)과 `apps/app/src/` (59 파일)이 동일한 코드
- **현황**: `vitest.config.ts` 경로 수정 테스트 완료 (테스트 통과). 하지만 root `middleware.ts`, `scripts/harness.ts` 등 root 레벨에서 `src/`를 참조하는 파일들이 있어 단순 삭제 불가.
- **옵션**:
  1. `apps/app/src/`를 유지하고 `src/` 제거 + root 참조 파일들 경로 수정
  2. `src/`를 유지하고 `apps/app/src/`를 심볼릭 링크로 대체
  3. 공유 로직을 `packages/shared/`로 이동
- **권장**: 옵션 1 (모노레포 구조 유지)
- **예상 노력**: 2시간
- **상태**: 미시작 (구조적 결정 필요)
