// app.js - Phiên bản đơn giản & mạnh mẽ - Chỉ dùng 1 file data
class AddressConverter {
    constructor() {
        this.fullData = null; // Sẽ chứa toàn bộ dữ liệu từ dvhcvn.json
        this.dataLoaded = false;
        this.currentResults = [];
        console.log('🚀 Công cụ chuyển đổi đã sẵn sàng. Đang tải dữ liệu...');
        this.init();
    }

    async init() {
        try {
            $('#loadingSection').show();
            console.log('📥 Đang tải dữ liệu từ dvhcvn.json...');
            
            const response = await fetch('data/dvhcvn.json');
            if (!response.ok) throw new Error(`Không tải được file: ${response.status}`);
            
            this.fullData = await response.json();
            this.dataLoaded = true;
            
            console.log('✅ Dữ liệu đã tải xong!');
            console.log('📊 Cấu trúc dữ liệu:', this.fullData.data ? 'Đã có data' : 'Không có data');
            
            // CẬP NHẬT GIAO DIỆN KHI THÀNH CÔNG
            $('#loadingSection').hide();
            $('#dataStatus').html(`
                <div class="alert alert-success d-flex align-items-center">
                    <i class="fas fa-check-circle fa-2x me-3"></i>
                    <div>
                        <h5 class="mb-1">Dữ liệu đã sẵn sàng!</h5>
                        <p class="mb-0">Tìm thấy <strong>${this.fullData.data?.length || 0}</strong> tỉnh/thành phố.</p>
                    </div>
                </div>
            `).show();
            
            $('.main-content').fadeIn(500);
            $('#btnConvert').prop('disabled', false);
            $('#versionInfo').text(`Dữ liệu: ${this.fullData.data?.length || 0} tỉnh`);
            
        } catch (error) {
            console.error('❌ Lỗi tải dữ liệu:', error);
            $('#loadingSection').html(`
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-triangle"></i> Lỗi tải dữ liệu!</h5>
                    <p>Không thể tải file <code>data/dvhcvn.json</code>.</p>
                    <p class="mb-0"><small>Vui lòng kiểm tra xem file đã được upload đúng chưa.</small></p>
                </div>
            `);
        }
    }

    // Hàm chuẩn hóa tên để so sánh (bỏ dấu, viết thường)
    normalize(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Hàm PHÂN TÍCH địa chỉ thông minh - CẢI TIẾN
    parseAddress(addressText) {
        let text = addressText.trim();
        let normalized = this.normalize(text);
        
        // 1. Tìm kiếm trực tiếp các từ khóa Tỉnh/Huyện/Xã
        let foundProvince = null, foundDistrict = null, foundWard = null;
        
        // Duyệt qua tất cả tỉnh trong dữ liệu để tìm khớp TRỰC TIẾP trong chuỗi nhập
        if (this.fullData?.data) {
            for (const province of this.fullData.data) {
                const normProvinceName = this.normalize(province.name);
                
                // Nếu tên tỉnh chuẩn hóa có mặt trong chuỗi địa chỉ đã chuẩn hóa
                if (normalized.includes(normProvinceName)) {
                    foundProvince = province;
                    console.log(`   Tìm thấy tỉnh: ${province.name}`);
                    
                    // TÌM XÃ: Tìm trong danh sách xã của tỉnh này
                    if (province.wards && province.wards.length > 0) {
                        for (const ward of province.wards) {
                            const normWardName = this.normalize(ward.name);
                            // Tìm tên xã trong toàn bộ chuỗi địa chỉ
                            if (normalized.includes(normWardName)) {
                                foundWard = ward;
                                console.log(`   Tìm thấy xã: ${ward.name}`);
                                break; // Thoát khi tìm thấy xã đầu tiên khớp
                            }
                        }
                    }
                    break; // Thoát khi đã tìm thấy và xử lý xong một tỉnh
                }
            }
        }
        
        return {
            original: text,
            normalized: normalized,
            province: foundProvince,
            ward: foundWard,
            status: foundProvince ? (foundWard ? 'success' : 'warning') : 'error',
            message: foundProvince ? 
                     (foundWard ? 'Tìm thấy tỉnh và xã' : 'Tìm thấy tỉnh, không rõ xã') : 
                     'Không tìm thấy tỉnh'
        };
    }

    // Xử lý HÀNG LOẠT địa chỉ
    async processAll(addresses) {
        if (!this.dataLoaded) {
            alert('Vui lòng đợi dữ liệu tải xong.');
            return;
        }
        
        const total = addresses.length;
        const results = [];
        
        // Hiển thị thanh tiến trình
        $('#progressContainer').show();
        $('#progressBar').css('width', '0%');
        $('#progressPercent').text('0%');
        
        for (let i = 0; i < total; i++) {
            const address = addresses[i];
            
            // Cập nhật tiến trình
            const percent = Math.round(((i + 1) / total) * 100);
            $('#progressBar').css('width', percent + '%');
            $('#progressPercent').text(percent + '%');
            $('#progressText').text(`Đang xử lý: ${i + 1}/${total}`);
            
            // Phân tích địa chỉ
            const result = this.parseAddress(address);
            results.push({
                index: i + 1,
                original: address,
                province: result.province?.name || '',
                ward: result.ward?.name || '',
                status: result.status,
                message: result.message
            });
            
            // Tạm dừng nhỏ để UI cập nhật (nếu có nhiều dữ liệu)
            if (total > 50) await new Promise(r => setTimeout(r, 10));
        }
        
        $('#progressContainer').hide();
        return results;
    }

    // HIỂN THỊ kết quả lên bảng
    displayResults(results) {
        this.currentResults = results;
        const tableBody = $('#resultBody');
        tableBody.empty();
        
        let success = 0, warning = 0, error = 0;
        
        results.forEach(item => {
            // Thống kê
            if (item.status === 'success') success++;
            else if (item.status === 'warning') warning++;
            else error++;
            
            // Xác định màu sắc và icon
            let badgeClass, badgeIcon, statusText;
            if (item.status === 'success') {
                badgeClass = 'badge-success'; badgeIcon = 'fa-check-circle'; statusText = 'Thành công';
            } else if (item.status === 'warning') {
                badgeClass = 'badge-warning'; badgeIcon = 'fa-exclamation-triangle'; statusText = 'Cảnh báo';
            } else {
                badgeClass = 'badge-danger'; badgeIcon = 'fa-times-circle'; statusText = 'Lỗi';
            }
            
            // Tạo hàng cho bảng
            const row = `
                <tr>
                    <td class="fw-bold">${item.index}</td>
                    <td><small>${this.escapeHtml(item.original)}</small></td>
                    <td>${this.escapeHtml(item.province) || '-'}</td>
                    <td>-</td> <!-- Cột Huyện cũ, có thể bỏ trống hoặc điền sau -->
                    <td>${this.escapeHtml(item.ward) || '-'}</td>
                    <td><span class="badge ${badgeClass}"><i class="fas ${badgeIcon}"></i> ${statusText}</span></td>
                </tr>
            `;
            tableBody.append(row);
        });
        
        // Hiển thị thống kê tổng quan
        const total = results.length;
        const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
        $('#resultTitle').text(`ĐÃ XỬ LÝ ${total} ĐỊA CHỈ`);
        $('#successCount').text(success);
        $('#warningCount').text(warning);
        $('#errorCount').text(error);
        $('#successRate').text(`${successRate}%`);
        $('#resultText').html(`
            <strong>${success} thành công</strong> | ${warning} cảnh báo | ${error} lỗi
            <span class="float-end">Tỷ lệ thành công: <strong>${successRate}%</strong></span>
        `);
        $('#resultStats').show();
        
        // Khởi tạo DataTable cho bảng
        if ($.fn.DataTable.isDataTable('#resultTable')) {
            $('#resultTable').DataTable().destroy();
        }
        $('#resultTable').DataTable({
            pageLength: 10,
            language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/vi.json' }
        }).show();
        
        // Hiện nút xuất file
        $('#exportSection').show();
    }

    // Hàm tiện ích: chuyển đổi ký tự đặc biệt để hiển thị an toàn trong HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== KHI TRANG ĐÃ TẢI XONG ====================
$(document).ready(function() {
    console.log('📄 Trang đã sẵn sàng, khởi tạo công cụ...');
    const converter = new AddressConverter();
    
    // --- ĐĂNG KÝ CÁC NÚT BẤM ---
    
    // Đếm số dòng nhập vào
    $('#inputAddresses').on('input', function() {
        const lines = $(this).val().trim().split('\n').filter(l => l.trim() !== '');
        $('#lineCount').text(lines.length);
    });
    
    // Nút BẮT ĐẦU CHUYỂN ĐỔI
    $('#btnConvert').click(async function() {
        const input = $('#inputAddresses').val().trim();
        if (!input) {
            alert('Hãy nhập ít nhất một địa chỉ.');
            return;
        }
        const addresses = input.split('\n').filter(l => l.trim() !== '');
        console.log(`Bắt đầu chuyển đổi ${addresses.length} địa chỉ...`);
        
        const results = await converter.processAll(addresses);
        converter.displayResults(results);
    });
    
    // Nút DÙNG VÍ DỤ
    $('#btnExample').click(function() {
        const examples = `Số 34 ấp Bình Long, xã Thanh Bình, huyện Chợ Gạo, tỉnh Tiền Giang
Phường Trúc Bạch, quận Ba Đình, thành phố Hà Nội
Thôn 5, xã Ea Khal, huyện Ea H'Leo, tỉnh Đắk Lắk`;
        $('#inputAddresses').val(examples);
        $('#lineCount').text('3');
    });
    
    // Nút XÓA TẤT CẢ
    $('#btnReset').click(function() {
        if (confirm('Xóa toàn bộ dữ liệu đã nhập và kết quả?')) {
            $('#inputAddresses').val('');
            $('#lineCount').text('0');
            $('#resultStats').hide();
            $('#resultTable').hide();
            $('#exportSection').hide();
            converter.currentResults = [];
        }
    });
    
    // Nút TẢI CSV (chức năng đơn giản)
    $('#btnExportCSV').click(function() {
        if (converter.currentResults.length === 0) {
            alert('Chưa có dữ liệu để xuất.');
            return;
        }
        // Tạo nội dung CSV đơn giản
        const headers = ['STT', 'Địa chỉ gốc', 'Tỉnh mới', 'Xã mới', 'Trạng thái'];
        const rows = converter.currentResults.map(r => [
            r.index,
            `"${r.original.replace(/"/g, '""')}"`,
            r.province,
            r.ward,
            r.status === 'success' ? 'Thành công' : r.status === 'warning' ? 'Cảnh báo' : 'Lỗi'
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        // Tạo file tải về
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ket_qua_chuyen_doi_${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    console.log('✅ Tất cả chức năng đã sẵn sàng.');
});
