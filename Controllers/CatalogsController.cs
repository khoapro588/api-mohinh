using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelStore.Models;
using ModelStore.Data;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CatalogsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public CatalogsController(ApplicationDbContext db) => _db = db;

        [HttpGet("category/{category}")]
        public async Task<IActionResult> GetModelsByCategory(string category)
        {
            var models = await _db.FigureModels
                .Where(m => m.Category.ToLower() == category.ToLower())
                .ToListAsync();
            return Ok(models);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchModels([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(await _db.FigureModels.ToListAsync());

            var models = await _db.FigureModels
                .Where(m => m.Name.ToLower().Contains(q.ToLower()) || m.Brand.ToLower().Contains(q.ToLower()))
                .ToListAsync();
            return Ok(models);
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedModels()
        {
            var models = await _db.FigureModels
                .Where(m => m.IsFeatured)
                .ToListAsync();
            return Ok(models);
        }

        [HttpGet("brand/{brand}")]
        public async Task<IActionResult> GetModelsByBrand(string brand)
        {
            var models = await _db.FigureModels
                .Where(m => m.Brand.ToLower() == brand.ToLower())
                .ToListAsync();
            return Ok(models);
        }

        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestModels()
        {
            var models = await _db.FigureModels
                .OrderByDescending(m => m.Id)
                .Take(8)
                .ToListAsync();
            return Ok(models);
        }

        [HttpGet("sale")]
        public async Task<IActionResult> GetSaleModels()
        {
            var models = await _db.FigureModels
                .Where(m => m.IsOnSale)
                .ToListAsync();
            return Ok(models);
        }
    }
}
