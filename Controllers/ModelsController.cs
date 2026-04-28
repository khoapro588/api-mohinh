using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelStore.Models;
using ModelStore.Data;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModelsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ModelsController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAllModels()
        {
            var models = await _db.FigureModels.ToListAsync();
            return Ok(models);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetModelById(int id)
        {
            var model = await _db.FigureModels.FindAsync(id);
            if (model == null) return NotFound();
            return Ok(model);
        }

        [HttpPost]
        public async Task<IActionResult> CreateModel([FromBody] FigureModel model)
        {
            _db.FigureModels.Add(model);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetModelById), new { id = model.Id }, model);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateModel(int id, [FromBody] FigureModel updatedModel)
        {
            var model = await _db.FigureModels.FindAsync(id);
            if (model == null) return NotFound();

            model.Name = updatedModel.Name;
            model.Category = updatedModel.Category;
            model.Brand = updatedModel.Brand;
            model.Price = updatedModel.Price;
            model.Stock = updatedModel.Stock;
            model.ImageUrl = updatedModel.ImageUrl;
            model.IsFeatured = updatedModel.IsFeatured;
            model.IsOnSale = updatedModel.IsOnSale;
            model.Series = updatedModel.Series;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModel(int id)
        {
            var model = await _db.FigureModels.FindAsync(id);
            if (model == null) return NotFound();
            _db.FigureModels.Remove(model);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/price")]
        public async Task<IActionResult> UpdatePrice(int id, [FromBody] decimal newPrice)
        {
            var model = await _db.FigureModels.FindAsync(id);
            if (model == null) return NotFound();
            model.Price = newPrice;
            await _db.SaveChangesAsync();
            return Ok(model);
        }

        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] int newStock)
        {
            var model = await _db.FigureModels.FindAsync(id);
            if (model == null) return NotFound();
            model.Stock = newStock;
            await _db.SaveChangesAsync();
            return Ok(model);
        }
    }
}
