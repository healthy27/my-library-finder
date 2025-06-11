const SERVICE_KEY = 'gBnvi8mi3uFHoE69tB2vFTryhbATIX0egTyIFHlocqh4y01p6OmwUD9cmPtUL63HyKE+j9GfFZ6QR2lPm7eb0w==';
const BASE_URL = 'https://api.odcloud.kr/api';
const API_ENDPOINT = '/15072611/v1/uddi:399f3ae3-2e03-4c98-89b4-bb2d37369935'; // 주소, 전화번호 포함된 버전

let allLibrariesData = [];

$(document).ready(function () {
    $('#searchButton').on('click', function () {
        const searchKeyword = $('#searchInput').val();
        filterAndDisplayLibraries(searchKeyword);
    });

    $('#myLocationButton').on('click', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                alert(`현재 위치: 위도 ${lat}, 경도 ${lon} (위치 기반 검색 기능은 추후 구현 예정)`);
            }, function (error) {
                console.error("위치 정보를 가져오는 데 실패:", error);
                alert("위치 정보 접근 권한을 허용해주세요.");
            });
        } else {
            alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
        }
    });

    fetchAllLibraries();
});

function fetchAllLibraries() {
    const queryParams = {
        page: 1,
        perPage: 100
    };

    const queryString = $.param(queryParams);
    const apiUrl = `${BASE_URL}${API_ENDPOINT}?${queryString}&serviceKey=${encodeURIComponent(SERVICE_KEY)}`;

    console.log("API URL:", apiUrl);

    $.ajax({
        url: apiUrl,
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log("API 응답:", response);
            if (response && response.data) {
                // ❗ 교도소/구치소 제외한 항목만 저장
                allLibrariesData = response.data.filter(lib => {
                    const name = lib.도서관명?.toLowerCase() || '';
                    const address = lib.주소?.toLowerCase() || '';
                    return !name.includes('교도소') && !name.includes('구치소') && !address.includes('교도소');
                });
                filterAndDisplayLibraries('');
            } else {
                $('#libraryList').html('<p>도서관 정보를 찾을 수 없습니다.</p>');
            }
        },
        error: function (xhr, status, error) {
            console.error("API 호출 중 오류:", status, error, xhr.responseText);
            $('#libraryList').html('<p>도서관 정보를 가져오는 데 실패했습니다.</p>');
            alert("API 인증 또는 호출 형식에 문제가 있을 수 있습니다.");
        }
    });
}

function filterAndDisplayLibraries(keyword) {
    const $libraryList = $('#libraryList');
    $libraryList.empty();

    let filteredLibraries = allLibrariesData;

    if (keyword) {
        const lowerCaseKeyword = keyword.toLowerCase();
        filteredLibraries = allLibrariesData.filter(lib => {
            const name = lib.도서관명?.toLowerCase() || '';
            const address = lib.주소?.toLowerCase() || '';

            const isLibraryNameMatch = name.includes(lowerCaseKeyword);
            const isAddressMatch = address.includes(lowerCaseKeyword);

            // ❗ 검색 결과에서도 교정시설 제거
            const isCorrectional = name.includes('교도소') || name.includes('구치소') || address.includes('교도소');

            return (isLibraryNameMatch || isAddressMatch) && !isCorrectional;
        });
    }

    if (filteredLibraries.length === 0) {
        $libraryList.html('<p>검색 결과가 없습니다.</p>');
        return;
    }

    $.each(filteredLibraries, function (index, lib) {
        const libraryCard = `
            <div class="library-card">
                <h3>${lib.도서관명 || '이름 없음'}</h3>
                <p><strong>주소:</strong> ${lib.주소 || '정보 없음'}</p>
                <p><strong>전화번호:</strong> ${lib.전화번호 || '정보 없음'}</p>
                <p><strong>운영시간:</strong> ${lib.개장시간 || '정보 없음'}</p>
                <p><strong>휴관일:</strong> ${lib.도서관휴일 || '정보 없음'}</p>
                <p><a href="${lib.홈페이지 || '#'}" target="_blank">홈페이지</a></p>
            </div>
        `;
        $libraryList.append(libraryCard);
    });
}
