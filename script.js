$(document).ready(function () {
  $('#searchButton').on('click', function () {
    const keyword = $('#searchInput').val();
    filterAndDisplayLibraries(keyword);
  });

  $('#sortOption').on('change', function () {
    const keyword = $('#searchInput').val();
    filterAndDisplayLibraries(keyword);
  });

  fetchCombinedLibraryData();
});

const OD_SERVICE_KEY = 'gBnvi8mi3uFHoE69tB2vFTryhbATIX0egTyIFHlocqh4y01p6OmwUD9cmPtUL63HyKE+j9GfFZ6QR2lPm7eb0w==';
const NEW_SERVICE_KEY = 'gBnvi8mi3uFHoE69tB2vFTryhbATIX0egTyIFHlocqh4y01p6OmwUD9cmPtUL63HyKE+j9GfFZ6QR2lPm7eb0w==';

const OD_API_BASE = 'https://api.odcloud.kr/api';
const OD_API_ENDPOINT = '/15072611/v1/uddi:399f3ae3-2e03-4c98-89b4-bb2d37369935';
const NEW_API_BASE = 'https://apis.data.go.kr/B551982/plr';
const NEW_API_ENDPOINT = '/info';

let allLibrariesData = [];

function fetchCombinedLibraryData() {
  const odUrl = `${OD_API_BASE}${OD_API_ENDPOINT}?page=1&perPage=2000&serviceKey=${encodeURIComponent(OD_SERVICE_KEY)}`;
  const newUrl = `${NEW_API_BASE}${NEW_API_ENDPOINT}?serviceKey=${encodeURIComponent(NEW_SERVICE_KEY)}`;

  Promise.all([
    $.ajax({ url: odUrl, type: 'GET', dataType: 'json' }),
    $.ajax({ url: newUrl, type: 'GET', dataType: 'json' })
  ])
    .then(([odRes, newRes]) => {
      const odData = odRes.data || [];
      const newData = newRes.response?.body?.items || [];

      const combined = [
        ...odData.map(lib => ({ ...lib, 출처: 'ODcloud' })),
        ...newData.map(lib => ({ ...lib, 출처: '지역정보개발원' }))
      ].map(lib => ({
        도서관명: lib.도서관명 || lib.libNm || '이름 없음',
        주소: lib.주소 || lib.addr || '정보 없음',
        전화번호: lib.전화번호 || lib.telNo || '정보 없음',
        홈페이지: lib.홈페이지 || lib.hmpgAddr || '#',
        개장시간: lib.개장시간 || lib.opTime || '정보 없음',
        도서관휴일: lib.도서관휴일 || '정보 없음',
        출처: lib.출처
      }));

      allLibrariesData = combined.filter(lib => {
        const name = lib.도서관명.toLowerCase();
        const addr = lib.주소.toLowerCase();
        return !name.includes('교도소') && !name.includes('구치소') && !addr.includes('교도소');
      });

      filterAndDisplayLibraries('');
    })
    .catch(error => {
      console.error("API 통합 오류:", error);
      $('#libraryList').html('<p>도서관 데이터를 불러오는 데 실패했습니다.</p>');
    });
}

function filterAndDisplayLibraries(keyword) {
  const $list = $('#libraryList');
  $list.empty();

  let filtered = keyword
    ? allLibrariesData.filter(lib =>
        lib.도서관명.toLowerCase().includes(keyword.toLowerCase()) ||
        lib.주소.toLowerCase().includes(keyword.toLowerCase()))
    : [...allLibrariesData];

  const sortOption = $('#sortOption').val();
  if (sortOption === 'name') {
    filtered.sort((a, b) => {
      const nameA = a.도서관명.replace(/[^가-힣]/g, '');
      const nameB = b.도서관명.replace(/[^가-힣]/g, '');
      return nameA.localeCompare(nameB);
    });
  } else if (sortOption === 'source') {
    filtered.sort((a, b) => a.출처.localeCompare(b.출처));
  }

  $('#resultCount').text(filtered.length);

  if (filtered.length === 0) {
    $list.html('<p>검색 결과가 없습니다.</p>');
    return;
  }

  filtered.forEach(lib => {
    const card = `
      <div class="col-md-6">
        <div class="library-card">
          <h3>${lib.도서관명}</h3>
          <p><strong>주소:</strong> ${lib.주소}</p>
          <p><strong>전화번호:</strong> ${lib.전화번호}</p>
          <p><strong>운영시간:</strong> ${lib.개장시간}</p>
          <p><strong>휴관일:</strong> ${lib.도서관휴일}</p>
          <p><strong>출처:</strong> ${lib.출처}</p>
          <p><a href="${lib.홈페이지}" target="_blank">홈페이지</a></p>
        </div>
      </div>
    `;
    $list.append(card);
  });
}
