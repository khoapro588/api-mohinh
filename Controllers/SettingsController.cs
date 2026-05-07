using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public SettingsController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            string path = Path.Combine(_env.WebRootPath, "categories.json");
            if (!System.IO.File.Exists(path))
            {
                return Ok(new object[] { });
            }
            string json = System.IO.File.ReadAllText(path);
            return Content(json, "application/json");
        }

        [HttpPost("categories")]
        public IActionResult UpdateCategories([FromBody] object categoriesData)
        {
            try
            {
                string path = Path.Combine(_env.WebRootPath, "categories.json");
                string json = JsonSerializer.Serialize(categoriesData, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(path, json);
                return Ok(new { message = "Cập nhật danh mục thành công!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lưu danh mục: " + ex.Message });
            }
        }
        [HttpGet("menus")]
        public IActionResult GetMenus()
        {
            string path = Path.Combine(_env.WebRootPath, "menus.json");
            if (!System.IO.File.Exists(path)) return Ok(new object[] { });
            string json = System.IO.File.ReadAllText(path);
            return Content(json, "application/json");
        }

        [HttpPost("menus")]
        public IActionResult UpdateMenus([FromBody] object menusData)
        {
            try
            {
                string path = Path.Combine(_env.WebRootPath, "menus.json");
                string json = JsonSerializer.Serialize(menusData, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(path, json);
                return Ok(new { message = "Cập nhật menu thành công!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lưu menu: " + ex.Message });
            }
        }
    }
}
