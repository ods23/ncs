import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const PrintPreview = ({ open, onClose, printData = [], onPrintComplete, apiEndpoint = '/api/new-comer-graduates' }) => {
  // 날짜 포맷팅 함수 (yyyy년 mm월 dd일 형식)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${day}일`;
  };

  // 이름 포맷팅 함수 (3자 이하는 띄어쓰기, 4자 이상은 붙여쓰기)
  const formatName = (name) => {
    if (!name) return '';
    
    const nameLength = name.length;
    if (nameLength <= 3) {
      // 3자 이하인 경우 한자씩 띄어쓰기
      return name.split('').join(' ');
    } else {
      // 4자 이상인 경우 붙여쓰기
      return name;
    }
  };

  // 실제 프린트 실행
  const handlePrint = async () => {
    // 숨겨진 iframe을 사용하여 프린트 처리
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const printContent = generatePrintHTML();
    const iframeDoc = iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();
    
    // 출력 완료 여부를 추적하는 변수
    let printCompleted = false;
    
    // iframe 로드 완료 후 프린트 실행
    iframe.onload = () => {
      setTimeout(() => {
        const iframeWindow = iframe.contentWindow;
        
        // beforeprint 이벤트: 프린트 다이얼로그가 열릴 때
        iframeWindow.addEventListener('beforeprint', () => {
          console.log('프린트 다이얼로그 열림');
        });
        
        // afterprint 이벤트: 프린트 다이얼로그가 닫힐 때 (인쇄 또는 취소)
        iframeWindow.addEventListener('afterprint', async () => {
          console.log('프린트 다이얼로그 닫힘');
          
          // 실제 인쇄 여부 확인을 위한 추가 지연
          setTimeout(async () => {
            // 사용자에게 실제 인쇄했는지 확인
            const actuallyPrinted = window.confirm('실제로 인쇄를 완료하셨습니까?\n"확인"을 누르면 출력횟수가 증가됩니다.');
            
            if (actuallyPrinted && !printCompleted) {
              printCompleted = true;
              
              try {
                const printPromises = printData.map(async (item) => {
                  const response = await fetch(`${apiEndpoint}/${item.id}/print`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  return response.ok;
                });

                const results = await Promise.all(printPromises);
                const successCount = results.filter(result => result).length;
                
                if (successCount === printData.length) {
                  alert(`${successCount}개 항목의 출력 횟수가 증가되었습니다.`);
                } else {
                  alert(`${successCount}/${printData.length}개 항목이 처리되었습니다.`);
                }

                // 부모 컴포넌트에 출력 완료 알림
                if (onPrintComplete) {
                  onPrintComplete();
                }
              } catch (error) {
                console.error('출력 횟수 업데이트 실패:', error);
                alert('출력은 완료되었지만 출력 횟수 업데이트 중 오류가 발생했습니다.');
              }
            } else {
              console.log('인쇄 취소됨 - 출력횟수 증가하지 않음');
            }
            
            // iframe 제거 및 다이얼로그 닫기
            document.body.removeChild(iframe);
            onClose();
          }, 500);
        });
        
        iframeWindow.focus();
        iframeWindow.print();
      }, 100);
    };
  };

  // 프린트용 HTML 생성
  const generatePrintHTML = () => {
    const certificateHTML = printData.map((item, index) => `
      <div class="certificate-page" style="
        width: 148mm;
        height: 210mm;
        margin: 0;
        padding: 0;
        page-break-after: ${index < printData.length - 1 ? 'always' : 'auto'};
        font-family: 'Malgun Gothic', sans-serif;
        background: white;
        box-sizing: border-box;
        position: relative;
      ">
        <!-- 수료번호 (위에서 2.5cm, 왼쪽에서 2.3cm) -->
        <div style="
          position: absolute;
          top: 25mm;
          left: 23mm;
          font-size: 14px;
          font-weight: bold;
          font-family: 'HY견조명', sans-serif;
          color: #000;
        ">제 ${item.graduate_number || ''}</div>
        
        <!-- 성명 (위에서 6.9cm, 왼쪽에서 7cm) -->
        <div style="
          position: absolute;
          top: 69mm;
          left: 70mm;
          font-size: 18px;
          font-weight: bold;
          font-family: 'HY견조명', sans-serif;
          color: #000;
        ">성 명 : ${formatName(item.name)}</div>
        
        <!-- 교육기간 (하단에서 5cm, 정중앙) -->
        <div style="
          position: absolute;
          bottom: 50mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 18px;
          font-weight: bold;
          font-family: 'HY견조명', sans-serif;
          color: #000;
        ">${formatDate(item.education_end_date)}</div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>수료증 출력 - A5 봉투용</title>
        <style>
          @page {
            size: A5 portrait !important;
            margin: 0 !important;
            marks: none;
            bleed: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
            background: white;
            width: 148mm;
            height: 210mm;
          }
          
          /* 프린트 최적화 */
          @media print {
            @page {
              size: A5 portrait !important;
              margin: 0 !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .certificate-page {
              break-inside: avoid;
              page-break-after: always;
            }
            
            .certificate-page:last-child {
              page-break-after: avoid;
            }
          }
          
          /* 봉투 타입 최적화 */
          .certificate-page {
            width: 148mm !important;
            height: 210mm !important;
            position: relative;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        ${certificateHTML}
      </body>
      </html>
    `;
  };

  // 미리보기용 수료증 컴포넌트
  const CertificatePreview = ({ item, index }) => (
    <Box
      sx={{
        width: '105mm',
        height: '148.5mm',
        margin: '0 auto',
        padding: '0',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        fontFamily: "'Malgun Gothic', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        transform: 'none',
        transformOrigin: 'top center',
        display: 'block',
        marginBottom: '0px'
      }}
    >
      {/* 수료번호 (위에서 2.5cm, 왼쪽에서 2.3cm) */}
      <Typography
        sx={{
          position: 'absolute',
          top: '12.5mm',
          left: '11.5mm',
          fontSize: '10px',
          fontWeight: 'bold',
          fontFamily: "'HY견조명', sans-serif",
          color: '#000'
        }}
      >
        제 {item.graduate_number || ''}
      </Typography>
      
      {/* 성명 (위에서 6.9cm, 왼쪽에서 7cm) */}
      <Typography
        sx={{
          position: 'absolute',
          top: '34.5mm',
          left: '35mm',
          fontSize: '13px',
          fontWeight: 'bold',
          fontFamily: "'HY견조명', sans-serif",
          color: '#000'
        }}
      >
        성 명 : {formatName(item.name)}
      </Typography>
      
      {/* 교육기간 (하단에서 5cm, 정중앙) */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: '25mm',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '13px',
          fontWeight: 'bold',
          fontFamily: "'HY견조명', sans-serif",
          color: '#000'
        }}
      >
        {formatDate(item.education_end_date)}
      </Typography>
      

    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: '700',
          fontSize: '18px',
          textAlign: 'center'
        }}
      >
        수료증 미리보기 ({printData.length}장)
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          padding: '5px',
          backgroundColor: '#f8f9fa',
          maxHeight: '70vh',
          overflow: 'auto'
        }}
      >
        {/* 수료증 미리보기 */}
        {printData.map((item, index) => (
          <CertificatePreview key={item.id || index} item={item} index={index} />
        ))}
      </DialogContent>
      
      <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: '600',
            textTransform: 'none',
            border: '2px solid #6b7280',
            color: '#6b7280',
            '&:hover': {
              borderColor: '#374151',
              color: '#374151'
            }
          }}
        >
          취소
        </Button>
        
        <Button 
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          sx={{
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: '600',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            fontSize: '16px',
            '&:hover': {
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)'
            }
          }}
        >
          출력하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintPreview;
