using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using ModelStore.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _db;
        private readonly HttpClient _httpClient;

        public ChatController(IConfiguration configuration, ApplicationDbContext db)
        {
            _configuration = configuration;
            _db = db;
            _httpClient = new HttpClient();
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest("Tin nhắn không được để trống.");
            }

            string apiKey = _configuration["AI:GeminiApiKey"] ?? "";
            
            if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE")
            {
                return Ok(new { reply = "Đây là AI giả lập do chưa có API Key." });
            }

            // Dùng gemini-1.5-flash ổn định nhất
            string endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

            // LẤY DỮ LIỆU TỪ DATABASE
            var products = await _db.FigureModels.Take(20).ToListAsync();
            var productListStr = string.Join("\n", products.Select(p => $"- Id: {p.Id}, Tên: {p.Name}, Giá: {p.Price:N0}đ, Hình: {p.ImageUrl}, Phân loại: {p.Category}"));

            var systemPrompt = $@"Bạn là nhân viên tư vấn bán hàng của ModelStore - cửa hàng bán mô hình cao cấp.
Bạn phải trả lời ngắn gọn, thân thiện bằng tiếng Việt (không dùng ký hiệu Markdown như ** hay ```). 
Nếu bạn giới thiệu sản phẩm nào trong danh sách, BẮT BUỘC phải hiển thị nó bằng đúng đoạn mã HTML này để khách hàng có thể click xem chi tiết:

<a href='product.html?id={"{"}Id{"}"}' class='ai-product-card' style='text-decoration:none;'>
  <img src='{"{"}Hình{"}"}' alt='{"{"}Tên{"}"}'>
  <div>
    <strong>{"{"}Tên{"}"}</strong><br>
    <span style='color:#e2b646'>{"{"}Giá{"}"}đ</span>
  </div>
</a>

Ví dụ: <a href='product.html?id=5' class='ai-product-card' style='text-decoration:none;'><img src='/images/1.jpg' alt='Zaku'><div><strong>Zaku</strong><br><span style='color:#e2b646'>320.000đ</span></div></a>

Dưới đây là danh sách sản phẩm cửa hàng:
{productListStr}

Khách hàng nói: {request.Message}";

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = systemPrompt } } }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(endpoint, content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseString);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text").GetString();

                    return Ok(new { reply = text });
                }
                else
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        var modelsResponse = await _httpClient.GetAsync($"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}");
                        var modelsStr = await modelsResponse.Content.ReadAsStringAsync();
                        return BadRequest(new { reply = "Lỗi tên Model. Danh sách model tài khoản của bạn được phép dùng: " + modelsStr });
                    }
                    return BadRequest(new { reply = "Lỗi từ Google AI: " + responseString });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { reply = "Lỗi hệ thống: " + ex.Message });
            }
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}
