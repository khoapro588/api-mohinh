using Microsoft.AspNetCore.Mvc;
using ModelStore.Utils;
using ModelStore.Data;
using ModelStore.Models;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _db;

        public PaymentsController(IConfiguration configuration, ApplicationDbContext db)
        {
            _configuration = configuration;
            _db = db;
        }

        [HttpPost("vnpay/create")]
        public IActionResult CreatePaymentUrl([FromBody] PaymentRequest request)
        {
            // Trong thực tế, bạn lưu Order vào DB tại đây và lấy OrderId
            // var orderId = SaveOrderToDatabase(request);
            var orderId = DateTime.Now.Ticks.ToString();

            string vnp_Returnurl = _configuration["VNPay:ReturnUrl"] ?? "http://localhost:5271/api/payments/vnpay/return";
            string vnp_Url = _configuration["VNPay:Url"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            string vnp_TmnCode = _configuration["VNPay:TmnCode"] ?? "8NDYBGVN"; 
            string vnp_HashSecret = _configuration["VNPay:HashSecret"] ?? "Z2Z7XG3Y9JQKZ7T4U9P8D3F5X1C6V2B8";

            var vnpay = new VnPayLibrary();

            vnpay.AddRequestData("vnp_Version", "2.1.0");
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", vnp_TmnCode);
            vnpay.AddRequestData("vnp_Amount", (request.Amount * 100).ToString()); 
            vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", Utils.Utils.GetIpAddress(HttpContext));
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toan don hang {orderId}");
            vnpay.AddRequestData("vnp_OrderType", "other"); // default
            vnpay.AddRequestData("vnp_ReturnUrl", vnp_Returnurl);
            vnpay.AddRequestData("vnp_TxnRef", orderId);

            string paymentUrl = vnpay.CreateRequestUrl(vnp_Url, vnp_HashSecret);

            return Ok(new { url = paymentUrl });
        }

        [HttpGet("vnpay/return")]
        public IActionResult PaymentCallback()
        {
            var vnpayData = Request.Query;
            var vnpay = new VnPayLibrary();

            foreach (var (key, value) in vnpayData)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(key, value.ToString());
                }
            }

            string vnp_HashSecret = _configuration["VNPay:HashSecret"] ?? "Z2Z7XG3Y9JQKZ7T4U9P8D3F5X1C6V2B8";
            string vnp_SecureHash = Request.Query["vnp_SecureHash"].ToString();
            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, vnp_HashSecret);

            if (checkSignature)
            {
                string vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");
                if (vnp_ResponseCode == "00")
                {
                    return Redirect("/payment-result.html?status=success");
                }
                else
                {
                    return Redirect("/payment-result.html?status=failed&code=" + vnp_ResponseCode);
                }
            }

            return Redirect("/payment-result.html?status=invalid");
        }
    }

    public class PaymentRequest
    {
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
